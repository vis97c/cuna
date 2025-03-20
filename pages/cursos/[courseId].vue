<template>
	<section id="course" :key="course?.id" class="--width-100">
		<XamuLoaderContent
			class="x-course flx --flxColumn --flx-start --gap-30"
			:content="!!course"
			:loading="coursePending || teachersPending"
		>
			<template v-if="course">
				<div class="flx --flxColumn --flx-start">
					<h2 :key="course.id">{{ course.name }}</h2>
					<div class="flx --flxColumn --flx-start --gap-5">
						<p v-if="course.alternativeNames?.length" title="Otros nombres">
							{{ course.alternativeNames.join(", ") }}.
						</p>
						<p class="--txtSize-xs --txtColor-dark5">
							Actualizado {{ courseUpdatedAt }}
						</p>
					</div>
					<p v-if="course.description" class="--txtLineHeight-xl">
						{{ course.description }}
					</p>
				</div>
				<div v-if="SESSION.user" class="flx --flxColumn --flx-start --width-100">
					<div class="txt">
						<h4 class="">Herramientas:</h4>
						<p v-if="SESSION.canDevelop && fromSIA === false" class="">
							Parece que este curso contiene datos erroneos, considera eliminarlo
						</p>
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
							<XamuActionButtonToggle
								v-if="SESSION.user"
								tooltip="Notificarme"
								:disabled="!APP.instance?.flags?.trackCourses"
								:size="eSizes.LG"
								round
								@click="trackCourse"
							>
								<XamuIconFa name="bell" :size="20" regular />
								<XamuIconFa name="bell" :size="20" />
							</XamuActionButtonToggle>
						</div>
						<div
							v-if="SESSION.canModerate"
							class="flx --flxRow-wrap --flx-start-center"
						>
							<XamuActionButton
								tooltip="Forzar actualizacion"
								@click="() => course && scrapeCourse(course)"
							>
								<XamuIconFa name="refresh" />
							</XamuActionButton>
							<XamuModal
								class="--txtColor"
								title="Añadir grupo no reportado"
								:save-button="{ title: 'Añadir grupo' }"
								invert-theme
								@close="closeAddGroup"
								@save="addGroup"
							>
								<template #toggle="{ toggleModal }">
									<XamuActionButton
										tooltip="¿Hay un grupo no reportado?"
										@click="toggleModal"
									>
										Añadir grupo
									</XamuActionButton>
								</template>
								<template #default>
									<div class="--maxWidth-440">
										<XamuForm
											v-model="addGroupInputs"
											v-model:invalid="invalidAddGroup"
											title="Nuevo grupo"
										/>
									</div>
								</template>
							</XamuModal>
							<XamuActionButton
								v-if="SESSION.canDevelop"
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
				<XamuLoaderContent
					:loading="coursePending || teachersPending || refetching"
					:content="!!groups.length || !!unreportedGroups.length"
					label="Actualizando desde el antiguo SIA..."
					no-content-message="No hay grupos disponibles en este momento."
					class="--width-100"
				>
					<div v-if="groups.length" class="flx --flxColumn --flx-start --width-100">
						<div class="flx --flxRow --flx-start-center">
							<h4>Grupos ({{ course.groups?.length || 0 }}):</h4>
							<XamuActionButton
								v-if="SESSION.canModerate"
								:disabled="teachersPending"
								@click="refreshTeachers"
							>
								<XamuIconFa name="refresh" />
								<span>Actualizar profesores</span>
							</XamuActionButton>
						</div>
						<XamuTable
							:property-order="() => 0"
							:nodes="groups"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
							:properties="[
								{
									value: 'inscrito',
									component: TableEnroll,
									hidden: !SESSION.user,
								},
								{ value: 'profesores', component: TableTeachersList },
								{ value: 'horarios', component: TableWeek },
							]"
							prefer-id
						/>
					</div>
					<div
						v-if="unreportedGroups.length"
						class="flx --flxColumn --flx-start --width-100"
					>
						<div class="txt --gap-5">
							<h4>Grupos no reportados ({{ course.unreported?.length || 0 }}):</h4>
							<p class="--txtSize-xs">
								*Estos grupos estan activos en el SIA, pero aun no podemos
								actualizar sus cupos.
							</p>
						</div>
						<XamuTable
							:property-order="() => 0"
							:nodes="unreportedGroups"
							:theme="eColors.PRIMARY"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
							:properties="[
								{
									value: 'inscrito',
									component: TableEnroll,
									hidden: !SESSION.user,
								},
								{ value: 'profesores', component: TableTeachersList },
								{ value: 'horarios', component: TableWeek },
							]"
							prefer-id
						/>
					</div>
				</XamuLoaderContent>
			</template>
		</XamuLoaderContent>
	</section>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";
	import { arrayUnion, doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
	import { FirebaseError } from "firebase/app";
	import type { iInvalidInput, iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, CourseRef, Group, Teacher } from "~/resources/types/entities";
	import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
	import { eSIALevel, eSIAPlace } from "~/functions/src/types/SIA";
	import { TableTeachersList, TableEnroll, TableWeek } from "#components";
	import type { EnrolledGroup } from "~/functions/src/types/entities";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({ path_label: "Curso", middleware: ["course-exists"] });

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();
	const { getResponse } = useFormInput();

	const estudiantesTheme = "estudiantes" as any;
	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = APP.instance?.config || {};
	const losEstudiantesCourses = `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	const refetching = ref(false);
	const deactivated = ref(false);
	const fromSIA = ref<boolean>();
	const addGroupInputs = ref(markRaw(useGroupInputs()));
	const invalidAddGroup = ref<iInvalidInput[]>([]);
	let unsub: Unsubscribe = () => undefined;

	const routeId = computed(() => <string>route.params.courseId);

	const { data: indexedCourse, pending: coursePending } = useAsyncData(
		`api:all:courses:${routeId.value}`,
		async () => {
			const nuxtCourse = await useFetchQuery<Course>(`/api/all/courses/${routeId.value}`);
			const { name, description, alternativeNames = [name] } = nuxtCourse;

			// Update meta
			route.meta.title = name;
			route.meta.description = description;
			route.meta.keywords = alternativeNames.join(", ");

			return nuxtCourse;
		}
	);

	const {
		data: indexedTeachers,
		pending: teachersPending,
		refresh: refreshTeachers,
	} = useAsyncData(
		`api:teachers:course:${indexedCourse.value?.code}`,
		async () => {
			const code = indexedCourse.value?.code;

			if (!code || !SESSION.user) return [];

			const teachersEdges = await useFetchQuery<iPageEdge<Teacher, string>[]>(
				"/api/teachers/search",
				{ courses: [code] }
			);

			return teachersEdges.map(({ node }) => node);
		},
		{ watch: [() => indexedCourse.value?.updatedAt, () => indexedCourse.value?.code] }
	);

	const course = computed({
		get: () => {
			if (!indexedCourse.value) return;

			return useMapCourse(indexedCourse.value);
		},
		set(newCourse) {
			if (!newCourse) return;

			indexedCourse.value = newCourse;
		},
	});

	const courseUpdatedAt = computed(() => {
		const date = new Date(course.value?.updatedAt || new Date());

		return useTimeAgo(date);
	});
	const groups = computed(() => {
		if (!Array.isArray(course.value?.groups)) return [];

		return (course.value?.groups || []).map(mapGroupLike);
	});
	const unreportedGroups = computed(() => {
		if (!Array.isArray(course.value?.unreported)) return [];
		if (!Array.isArray(course.value?.unreported)) return [];

		return (course.value?.unreported || []).map(mapGroupLike);
	});

	function mapGroupLike({
		name,
		classrooms,
		teachers = [],
		schedule,
		spots,
		availableSpots,
	}: Group) {
		const mappedTeachers = teachers.map((name) => {
			const teacher = indexedTeachers.value?.find((t) => t.name === name);

			return teacher || name;
		});
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
			profesores: mappedTeachers,
			horarios: inscrito,
			inscrito,
		};
	}

	const trackCourse = debounce(async () => {
		if (!course.value) return;

		SESSION.trackCourse(course.value);

		// Notify user of the success
		await Swal.fire({
			title: "Curso rastreado",
			text: `Obtendrás actualizaciones del curso ${course.value?.name} periódicamente`,
			icon: "success",
		});
	});

	const removeCourse = debounce(async () => {
		if (!SESSION.canModerate || !course.value) return;

		const { value } = await Swal.firePrevent({
			title: "Eliminar curso",
			text: "¿Esta seguro de querer eliminar este curso?",
			footer: "Borraremos toda su información, esta acción no es reversible, pero podra ser reindexado mas tarde",
		});

		if (!value) return;

		unsub(); // close firebase socket

		const removed = await useDocumentDelete(course.value);

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

	function closeAddGroup() {
		addGroupInputs.value = useGroupInputs();
		invalidAddGroup.value = [];
	}
	async function addGroup(willOpen: () => void, event: Event) {
		const { invalidInputs, withErrors, validationHadErrors, errors } = await getResponse<
			boolean | null,
			Pick<
				Group,
				"name" | "spots" | "availableSpots" | "teachers" | "classrooms" | "schedule"
			>
		>(
			async (newGroup) => {
				if (!course.value) return { data: null };

				try {
					// update category
					const data = await useDocumentUpdate<Course>(course.value, {
						unreported: arrayUnion(newGroup),
					});

					return { data };
				} catch (errors: FirebaseError | unknown) {
					return { errors };
				}
			},
			addGroupInputs.value,
			event
		);

		invalidAddGroup.value = invalidInputs;

		if (!withErrors) {
			// Succesful request, notify user of the success
			Swal.fire({
				title: "Grupo añadido exitosamente",
				text: "En breve veras tu grupo nuevo",
				icon: "success",
				willOpen,
			});
		} else {
			if (!validationHadErrors) {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrió un error mientras añadiamos el grupo",
					icon: "error",
					target: <HTMLElement>event.target,
				});

				if (errors instanceof FirebaseError) console.debug(errors.code, errors);
				else console.error(errors);
			}
		}
	}

	/**
	 * Scrape course & update
	 *
	 * Do not remove PEAMA & PAES from indexing
	 */
	async function scrapeCourse(firebaseCourse: Course) {
		if (APP.SIAMaintenance || !$clientFirestore) return;

		refetching.value = true;

		const {
			code = "",
			level = eSIALevel.PREGRADO,
			place = eSIAPlace.BOGOTÁ,
			faculty,
			faculties = [faculty],
			programs = [],
			typologies = [],
		} = firebaseCourse;

		try {
			// Scrape from old SIA. Do not refetch from hydration
			fromSIA.value = await useFetchQuery<boolean>("/api/groups/scrape", {
				level,
				place,
				faculties,
				programs,
				typologies,
				code,
			});
		} catch (err) {
			const courseId = <string>route.params.courseId;
			const courseRef = doc($clientFirestore, "courses", courseId);
			const serializedError: Record<string, unknown> = JSON.parse(
				JSON.stringify(err, Object.getOwnPropertyNames(err))
			);

			// Custom error log, do not await
			useDocumentCreate("logs", {
				at: "pages:cursos:[courseId]:onMounted",
				message: serializedError.message,
				courseRef,
				error: serializedError,
			});
		}

		refetching.value = false;
	}

	// lifecycle
	onActivated(() => (deactivated.value = false));
	onDeactivated(() => (deactivated.value = true));
	onBeforeUnmount(unsub);
	onMounted(() => {
		if (import.meta.server || !SESSION.user || !$clientFirestore) return;

		const courseId = <string>route.params.courseId;
		const courseRef = doc($clientFirestore, "courses", courseId);

		// Hydrate course from firebase, then SIA & reindex
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

			const { createdByRef, updatedByRef, scrapedAt, ...firebaseCourse }: CourseRef =
				resolveSnapshotDefaults(snapshot.ref.path, snapshot.data());
			const { name, description, alternativeNames = [name], updatedAt } = firebaseCourse;

			// Update with hydration conditionally
			if (course.value?.updatedAt !== updatedAt) {
				// Update meta
				route.meta.title = name;
				route.meta.description = description;
				route.meta.keywords = alternativeNames.join(", ");

				// Update course
				course.value = { ...course.value, ...firebaseCourse };
			}

			const minutes = APP.instance?.config?.coursesScrapeRate || 5;
			const nowMilis = new Date().getTime();
			const updatedAtMilis = new Date(updatedAt || "").getTime();
			const updatedDiffMilis = nowMilis - updatedAtMilis;

			// Do once & update if updated more than threshold
			if (
				fromSIA.value !== undefined ||
				(scrapedAt && updatedDiffMilis < useMinMilis(minutes))
			) {
				if (firebaseCourse.description) return;
			}

			if (!refetching.value) scrapeCourse(firebaseCourse);
		});
	});
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-values {
			span.--txtSize-xs[title] {
				color: utils.color(dark, 0.5);
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
		tbody [data-column-name="name"] span:before {
			content: attr(title);
			position: absolute;
			top: 0;
			left: 0;
			color: utils.color(dark, 0.7);
		}
		tbody [data-column-name="programs"] {
			max-width: none;
		}
	}
</style>
