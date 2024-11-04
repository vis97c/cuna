<template>
	<section id="course" :key="routeCourseId" class="--width-100">
		<XamuLoaderContent
			class="x-course flx --flxColumn --flx-start --gap-30"
			:content="!!course"
			:loading="loading"
		>
			<template v-if="course">
				<div class="txt">
					<h2 :key="course.id">{{ course.name }}</h2>
					<p v-if="course.alternativeNames?.length" title="Otros nombres">
						{{ course.alternativeNames.join(", ") }}.
					</p>
					<p class="--txtSize-sm">Actualizado {{ updatedAt }}</p>
				</div>
				<div class="txt">
					<h4 class="">Herramientas:</h4>
					<p v-if="SESSION.canModerate && fromSIA === false" class="">
						Parece que este curso contiene datos erroneos, considera eliminarlo
					</p>
					<div class="flx --flxRow --flx-start-center">
						<XamuActionButton
							v-if="SESSION.canModerate"
							:theme="eColors.DANGER"
							@click="removeCourse"
						>
							Eliminar
						</XamuActionButton>
						<XamuActionButton
							:disabled="!APP.instance?.flags?.trackCourses"
							@click="trackCourse"
						>
							Rastrear curso
						</XamuActionButton>
					</div>
				</div>
				<div class="grd --grdColumns-auto3 --gap">
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								sede: course.place,
								facultad: course.faculty,
								programas: course.programs,
								cuposDisponibles: useCountSpots(course),
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								código: course.code,
								créditos: course.credits,
								tipologías: course.typologies,
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
				</div>
				<div v-if="filteredGroups.length" class="flx --flxColumn --flx-start --width-100">
					<div class="txt">
						<h4>Grupos ({{ course.groupCount || course.groups?.length || 0 }}):</h4>
					</div>
					<XamuTable
						:nodes="filteredGroups"
						:modal-props="{ class: '--txtColor', invertTheme: true }"
						class=""
					/>
				</div>
			</template>
		</XamuLoaderContent>
	</section>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";
	import { doc, onSnapshot } from "firebase/firestore";
	import type { iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { Course, Teacher } from "~/resources/types/entities";
	import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
	import { eSIAPlace } from "~/functions/src/types/SIA";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		middleware: ["auth-only"],
	});

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();

	const loading = ref(true);
	const course = ref<Course>();
	const fromSIA = ref<boolean>();
	const routeCourseId = computed(() => <string>route.params.courseId);

	const updatedAt = computed(() => {
		const date = new Date(course.value?.updatedAt || new Date());

		return useTimeAgo(date);
	});
	const filteredGroups = computed(() => {
		return (course.value?.groups || [])
			.filter(({ name = "" }) => {
				const lowerName = name.toLowerCase();

				if (
					!SESSION.withNonRegular &&
					(lowerName.includes("peama") || lowerName.includes("paes"))
				) {
					return false;
				}

				return true;
			})
			.map(({ name, activity, classrooms, teachers, schedule, spots, availableSpots }) => {
				const reschedule = (schedule || []).map((interval) => {
					if (!interval) return;

					return interval.split("|").join(" a ");
				});

				const [lunes, martes, miercoles, jueves, viernes, sabado, domingo] = reschedule;

				classrooms = classrooms?.filter((c) => !!c);

				return {
					nombre: `${name}ㅤ`, // hotfix to prevent it to parse as date
					cupos: `${availableSpots} de ${spots}`,
					actividad: activity,
					espacios: classrooms,
					profesores: teachers,
					horarios: { lunes, martes, miercoles, jueves, viernes, sabado, domingo },
				};
			});
	});

	const trackCourse = debounce(async () => {
		if (!course.value) return;

		SESSION.trackCourse(course.value);

		// Notify user of the success
		await Swal.fire({
			title: "Curso rastreado",
			text: `Obtendrás actualizaciones del curso ${course.value?.name} periódicamente`,
			footer: "Función aun no disponible",
			icon: "success",
		});
	});

	const removeCourse = debounce(async () => {
		if (!SESSION.canModerate || !course.value) return;

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

	// lifecycle

	/**
	 * Get course from firebase, then SIA & reindex
	 */
	const unsub = onSnapshot(doc($clientFirestore, "courses", routeCourseId.value), (snapshot) => {
		if (!snapshot.exists()) {
			throw createError({
				statusCode: 404,
				statusMessage: "El curso que buscas no esta indexado o no existe",
			});
		}

		const firebaseCourse: Course = resolveSnapshotDefaults(snapshot.ref.path, snapshot.data());
		const {
			id,
			code = "",
			programs = [],
			place = eSIAPlace.BOGOTÁ,
			updatedAt,
		} = firebaseCourse;
		const updatedAtMilis = new Date(updatedAt || "").getTime();
		const nowMilis = new Date().getTime();
		const millisDiff = nowMilis - updatedAtMilis;
		const minutes = APP.instance?.config?.coursesRefreshRate || 5;

		// Do once & update if updated more than threshold
		if (fromSIA.value === undefined && millisDiff > minutes * 60 * 1000) {
			// Get data from sia & reindex, do not await
			Promise.all([
				useSIACourses({ code, program: programs[0], place }),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: [code] },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
			]).then(([{ data }, indexedTeachers]) => {
				// Omit courses without groups
				const courses = data
					.map(useMapCourseFromSia)
					.filter(({ groups }) => !!groups?.length);
				const SIACourse = courses.find((c) => c.id === id);

				if (!SIACourse) {
					fromSIA.value = false;

					return;
				}

				// refresh if same course
				if (SIACourse.code === course.value?.code) course.value = SIACourse;

				// Reindex, do not await
				return useIndexCourse({ ...SIACourse, updatedAt, indexed: true, indexedTeachers });
			});
		}

		route.meta.title = firebaseCourse.name;
		course.value = firebaseCourse;
		loading.value = false;
	});

	onBeforeUnmount(unsub);
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-values [title^="Cantidad"] {
			&,
			.flx {
				flex-wrap: wrap;
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
