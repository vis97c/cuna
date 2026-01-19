<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<XamuLoaderContent
				class="x-course holder flx --flxColumn --flx-center"
				:content="!!course"
				:loading="coursePending"
			>
				<template v-if="course">
					<div class="flx --flxColumn --flx-start">
						<h2 :key="course.id">{{ course.name }}</h2>
						<div class="flx --flxColumn --flx-start --gap-5">
							<p v-if="course.alternativeNames?.length" title="Otros nombres">
								{{ course.alternativeNames.join(", ") }}.
							</p>
							<p v-if="course.updatedAt" class="--txtSize-xs --txtColor-dark5">
								<span>
									Actualizado {{ useTimeAgo(new Date(course.updatedAt)) }}
								</span>
								<span v-if="USER.canDevelop && course.scrapedAt">
									⋅ SIA {{ useTimeAgo(new Date(course.scrapedAt)) }}
								</span>
							</p>
						</div>
						<p v-if="course.description" class="--txtLineHeight-xl">
							{{ course.description }}
						</p>
					</div>
					<div v-if="USER.token" class="flx --flxColumn --flx-start --width-100">
						<div class="txt">
							<h4 class="">Herramientas:</h4>
						</div>
						<div class="flx --flxRow-wrap --flx-between-center --width-100">
							<div class="flx --flxRow-wrap --flx-start-center">
								<XamuActionButton
									:theme="estudiantesTheme"
									tooltip="Ver en los estudiantes"
									:href="`${losEstudiantesCourses}/${course.losEstudiantesCode}?from=cuna.com.co`"
									:size="eSizes.LG"
									:disabled="!course.losEstudiantesCode"
									round
								>
									<XamuIconFa name="hand-fist" :size="20" />
								</XamuActionButton>
							</div>
							<div
								v-if="USER.canModerate"
								class="flx --flxRow-wrap --flx-start-center"
							>
								<XamuActionButton
									tooltip="Forzar actualizacion"
									@click="refreshAll"
								>
									<XamuIconFa name="refresh" />
								</XamuActionButton>
								<XamuActionButton
									v-if="USER.canDevelop"
									tooltip="¿Se indexo con errores?"
									:theme="eColors.DANGER"
									@click="removeCourse"
								>
									Eliminar curso
								</XamuActionButton>
							</div>
						</div>
					</div>
					<div class="flx --flxColumn --flx-start --width-100">
						<div class="txt">
							<h4 class="">Detalles:</h4>
						</div>
						<div class="grd --grdColumns-auto3 --gap">
							<div class="x-values grd-item">
								<XamuValueList
									:value="{
										código: course.code,
										créditos: course.credits,
										cuposDisponibles: course.spotsCount,
										actividad: course.groups?.[0]?.activity || 'No definida',
									}"
									:modal-props="{ class: '--txtColor', invertTheme: true }"
								/>
							</div>
							<div class="x-values grd-item">
								<XamuValueList
									:value="{
										sede: course.place,
										facultades: course.faculties,
										programas: course.programs,
										tipologías: course.typologies,
									}"
									:modal-props="{ class: '--txtColor', invertTheme: true }"
								/>
							</div>
						</div>
					</div>
					<ClientOnly>
						<template #fallback>Cargando grupos...</template>
						<XamuPaginationContentTable
							:page="groupsPage"
							:url="`api:instance:courses:${courseId}:groups`"
							:map-node="useMapGroupEs"
							:defaults="{ page: true }"
							:table-props="{
								properties: [
									{
										value: 'inscrito',
										component: TableEnroll,
										hidden: !USER.token,
									},
									{ value: 'profesores', component: TableTeachersList },
									{ value: 'horarios', component: TableWeek },
								],
								modalProps: {
									invertTheme: true,
									class: '--txtColor',
								},
							}"
							label="Cargando grupos..."
							no-content-message="No hay grupos registrados"
							client
							@refresh="emittedGroupsRefresh = $event"
						/>
					</ClientOnly>
				</template>
			</XamuLoaderContent>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";
	import { doc, DocumentReference, onSnapshot, type Unsubscribe } from "firebase/firestore";

	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, Group } from "~/utils/types";
	import type { EnrolledGroup } from "~~/functions/src/types/entities";

	import { TableTeachersList, TableEnroll, TableWeek } from "#components";
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({ title: "Curso", middleware: ["course-exists"] });

	const CUNA = useCunaStore();
	// const INSTANCE = useInstanceStore();
	const USER = useUserStore();
	const router = useRouter();
	const route = useRoute();
	const cache = useRuntimeConfig().public.cache;
	const Swal = useSwal();
	const { $clientFirestore, $resolveClientRefs } = useNuxtApp();

	let unsub: Unsubscribe = () => undefined;

	const estudiantesTheme = "estudiantes" as any;
	const deactivated = ref(false);
	const emittedGroupsRefresh = ref<() => void>();

	const courseId = computed(() => <string>route.params.courseId);
	const courseApiPath = computed(() => `/api/instance/all/courses/${courseId.value}`);
	const losEstudiantesCourses = computed(() => {
		const config = CUNA.config || {};
		const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

		return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	});

	// const {
	// 	data: indexedCourse,
	// 	pending: coursePending,
	// 	refresh: refreshCourse,
	// 	error: courseError,
	// } = useCsrfFetch<Course>(`/api/instance/notes/${courseApiPath.value}`, {
	// 	method: "POST",
	// 	headers: { "Cache-Control": cache.none },
	// 	server: false,
	// });

	const {
		data: course,
		pending: coursePending,
		refresh: refreshCourse,
		error: courseError,
	} = useAsyncData(
		`api:all:courses:${courseId.value}`,
		async () => {
			const course = await useQuery<Course>(courseApiPath.value);

			return useMapCourse(course);
		},
		{ watch: [() => courseId.value] }
	);

	const groupsPage: iGetPage<Group> = (pagination) => {
		return useQuery<iPage<Group> | undefined>(`${courseApiPath.value}/groups`, {
			query: pagination,
			headers: { "Cache-Control": cache.none },
		});
	};

	function refreshAll() {
		refreshCourse();
		emittedGroupsRefresh.value?.();
	}

	function useMapGroupEs({ name, teachers, classrooms, schedule, spots, availableSpots }: Group) {
		const inscrito: EnrolledGroup = {
			schedule,
			teachers,
			name,
			courseId: course.value?.id || "",
			courseCode: course.value?.code || "",
			courseName: course.value?.name || "",
		};

		classrooms = classrooms?.filter((c) => !!c);

		return {
			id: `${name}`, // hotfix to prevent it to parse as date
			cupos: `${availableSpots} de ${spots}`,
			espacios: classrooms,
			profesores: teachers,
			horarios: inscrito,
			inscrito,
		};
	}

	const removeCourse = debounce(async () => {
		if (!USER.canModerate || !course.value) return;

		const { value } = await Swal.firePrevent({
			title: "Eliminar curso",
			text: "¿Esta seguro de querer eliminar este curso?",
			footer: "Borraremos toda su información, esta acción no es reversible, pero podra ser reindexado mas tarde",
		});

		if (!value) return;

		unsub(); // close firebase socket

		const removed = await useDocumentDelete({ id: course.value.id });

		if (removed) {
			// Notify user of the success
			await Swal.fire({
				title: "Curso eliminado",
				text: "Este podra ser reindexado mas tarde",
				icon: "success",
			});

			return router.push("/");
		}

		Swal.fire({
			title: "Curso eliminado",
			text: "Algo paso, el curso pudo no ser eliminado",
			icon: "error",
		});
	});

	// lifecycle
	watch(
		[course, courseError],
		([newCourse, newError]) => {
			if (newError) return showError(newError);

			if (newCourse) {
				const { name, description, alternativeNames = [name] } = newCourse;

				// Update meta
				route.meta.title = name;
				route.meta.description = description;
				route.meta.keywords = alternativeNames.join(", ");
			}
		},
		{ immediate: true }
	);
	onBeforeUnmount(unsub);
	onMounted(() => {
		if (import.meta.server || !USER.token || !$clientFirestore || !$resolveClientRefs) return;

		const courseId = <string>route.params.courseId;
		const courseRef: DocumentReference<Course> = doc($clientFirestore, "courses", courseId);

		// Hydrate course from firebase (Scraped server side)
		unsub = onSnapshot(courseRef, async (snapshot) => {
			// prevent hydration if not active
			if (deactivated.value) return;
			if (!snapshot.exists()) {
				unsub();

				throw showError({
					statusCode: 404,
					statusMessage: "El curso que buscas fue eliminado.",
				});
			}

			const courseData = $resolveClientRefs(snapshot);

			// Hydrate course
			if (courseData) {
				course.value = useMapCourse(courseData);
				emittedGroupsRefresh.value?.();
			}
		});
	});
	onActivated(() => (deactivated.value = false));
	onDeactivated(() => (deactivated.value = true));
</script>

<style lang="scss">
	@media only screen {
		.x-values {
			span.--txtSize-xs[title] {
				color: xamu.color(dark, 0.5);
			}
			[title^="Cantidad"] {
				&,
				.flx {
					flex-wrap: wrap;
				}
			}
		}

		tbody [data-column-name="name"] span {
			color: transparent;
		}
		tbody [data-column-name="name"] span::before {
			content: attr(title);
			position: absolute;
			top: 0;
			left: 0;
			color: xamu.color(dark, 0.7);
		}
		tbody [data-column-name="programs"] {
			max-width: none;
		}
	}
</style>
