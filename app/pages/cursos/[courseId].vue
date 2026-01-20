<template>
	<div id="landing" class="view">
		<XamuLoaderContent
			class="view-item --minHeightVh-100 --bgColor-light"
			:content="!!course"
			:loading="coursePending"
		>
			<section
				v-if="course"
				class="holder flx --flxColumn --flx-center-stretch --maxWidth-1080"
			>
				<div v-if="USER.token" class="flx --flxRow-wrap --flx-between-center --width-100">
					<div class="flx --flxRow-wrap --flx-start-center">
						<XamuActionButton
							:theme="estudiantesTheme"
							tooltip="Ver en los estudiantes"
							:href="`${losEstudiantesCourses}/${course.losEstudiantesCode}?from=cuna.com.co`"
							:disabled="!course.losEstudiantesCode"
							round
						>
							<XamuIconFa name="hand-fist" />
						</XamuActionButton>
					</div>
					<div class="flx --flxRow-wrap --flx-start-center">
						<XamuActionButton tooltip="Actualizar" @click="refreshAll">
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
				<div class="flx --flxColumn --flx-start">
					<h2 :key="course.id">{{ course.name }}</h2>
					<div class="flx --flxColumn --flx-start --gap-5">
						<p v-if="course.alternativeNames?.length" title="Otros nombres">
							{{ course.alternativeNames.join(", ") }}.
						</p>
						<p v-if="course.updatedAt" class="--txtSize-xs --txtColor-dark5">
							<span>Actualizado {{ useTimeAgo(new Date(course.updatedAt)) }}</span>
							<span v-if="USER.canDevelop && course.scrapedAt">
								⋅ SIA {{ useTimeAgo(new Date(course.scrapedAt)) }}
							</span>
						</p>
					</div>
					<p v-if="course.description" class="--txtSize-sm --txtLineHeight-xl">
						{{ course.description }}
					</p>
				</div>
				<div class="grd --grdColumns-auto3 --gap">
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								código: course.code,
								créditos: course.credits,
								cuposDisponibles: course.spotsCount,
								actividad: groupActivity || 'No definida',
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
				<ClientOnly>
					<template #fallback>Cargando grupos...</template>
					<XamuPaginationContentTable
						:page="groupsPage"
						:url="`api:instance:courses:${courseId}:groups`"
						:map-node="useMapGroupEs"
						:defaults="{ page: true, level: 1 }"
						:table-props="{
							preferId: true,
							mapNodes: filterGroups,
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
			</section>
		</XamuLoaderContent>
	</div>
</template>

<script setup lang="ts">
	import debounce from "lodash-es/debounce";
	import deburr from "lodash-es/deburr";
	import { doc, DocumentReference, onSnapshot, type Unsubscribe } from "firebase/firestore";

	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { Course, Group, Teacher } from "~/utils/types";

	import { TableTeachersList, TableEnroll, TableWeek } from "#components";
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	interface iGroupEs {
		id: string;
		cupos: string;
		espacios?: string[];
		profesores: Teacher[];
		horarios: boolean;
		inscrito: boolean;
	}

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
	const groupActivity = ref<string>("");

	const courseId = computed(() => <string>route.params.courseId);
	const losEstudiantesCourses = computed(() => {
		const config = CUNA.config || {};
		const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

		return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	});

	const {
		data: course,
		pending: coursePending,
		refresh: refreshCourse,
		error: courseError,
	} = useAsyncData(
		`api:all:courses:${courseId.value}`,
		async () => {
			const courseApiPath = `/api/instance/all/courses/${courseId.value}`;

			return useQuery<Course>(courseApiPath, {
				headers: { "Cache-Control": cache.none },
				cache: "reload",
			});
		},
		{ watch: [() => courseId.value] }
	);

	const groupsPage: iGetPage<Group> = (pagination) => {
		const courseApiPath = `/api/instance/courses/${courseId.value}`;

		return useCsrfQuery<iPage<Group> | undefined>(`${courseApiPath}/groups`, {
			method: "POST",
			query: pagination,
			headers: { "Cache-Control": cache.none },
			cache: "reload",
		});
	};

	function refreshAll() {
		refreshCourse();
		emittedGroupsRefresh.value?.();
	}

	function useMapGroupEs({ name, teachers, classrooms, spots, availableSpots }: Group): iGroupEs {
		return {
			id: `${name}`, // hotfix to prevent it to parse as date
			cupos: `${availableSpots} de ${spots}`,
			espacios: classrooms?.filter((c) => !!c),
			profesores: teachers,
			horarios: true,
			inscrito: true,
		};
	}

	const removeCourse = debounce(async () => {
		if (!USER.canModerate || !course.value?.id) return;

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

	function filterGroups(groups: Group[]) {
		const [, placeOnly] = deburr(USER.place).toLowerCase().replace(" de la", "").split("sede ");
		let thisPlace = false;
		let withPlaces = false;
		let activity = "";

		// Check if there are groups with place in their name
		for (const group of groups) {
			const lowerName = deburr(group.name).toLowerCase();

			activity ||= group.activity || activity;

			if (lowerName.includes(placeOnly)) thisPlace = true;
			if (lowerName.includes("sede")) withPlaces = true;
		}

		const filterGroups: iGroupEs[] = [];

		// Filter according to user preferences
		for (const group of groups) {
			const lowerName = deburr(group.name).toLowerCase();

			if (
				!USER.withNonRegular &&
				(lowerName.includes("peama") || lowerName.includes("paes"))
			) {
				// Filter out non-regular courses if user doesn't want to see them
				continue;
			} else if (thisPlace) {
				// Filter groups by user's place
				if (lowerName.includes(placeOnly)) filterGroups.push(useMapGroupEs(group));
			} else if (withPlaces) {
				// Show groups from other places
				if (lowerName.includes("otras sedes")) filterGroups.push(useMapGroupEs(group));
			}

			filterGroups.push(useMapGroupEs(group));
		}

		groupActivity.value = activity;

		return filterGroups;
	}

	// lifecycle
	watch(
		[course, courseError],
		([newCourse, newError], [oldCourse]) => {
			unsub();

			if (newError) return showError(newError);

			if (newCourse?.id && newCourse.updatedAt !== oldCourse?.updatedAt) {
				const { name, description, alternativeNames = [name] } = newCourse;

				// Update meta
				route.meta.title = name;
				route.meta.description = description;
				route.meta.keywords = alternativeNames.join(", ");

				if (import.meta.server || !USER.token || !$clientFirestore || !$resolveClientRefs) {
					return;
				}

				const courseRef: DocumentReference<Course> = doc($clientFirestore, newCourse.id);

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

					const courseData = await $resolveClientRefs(snapshot);

					// Hydrate course
					if (courseData?.id) {
						course.value = courseData;

						emittedGroupsRefresh.value?.();
					}
				});
			}
		},
		{ immediate: true }
	);
	onBeforeUnmount(unsub);
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
