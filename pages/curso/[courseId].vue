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
					<p v-if="course.alternativeNames?.length">
						<XamuValueComplex title="Otros nombres" :value="course.alternativeNames" />
					</p>
					<p class="--txtSize-sm">Actualizado {{ updatedAt }}</p>
				</div>
				<div v-if="SESSION.canModerate" class="txt">
					<h4 class="">Moderacion:</h4>
					<p v-if="fromSIA === false" class="">
						Parece que este curso contiene datos erroneos, considera eliminarlo
					</p>
					<XamuActionButton :theme="eColors.DANGER" @click="removeCourse">
						Eliminar
					</XamuActionButton>
				</div>
				<div class="grd --grdColumns-auto3 --gap">
					<div class="grd-item">
						<XamuValueList
							:value="{
								sede: course.place,
								facultad: course.faculty,
								programas: course.programs || 'No reportado',
								cuposDisponibles: useCountSpots(course),
							}"
						/>
					</div>
					<div class="grd-item">
						<XamuValueList
							:value="{
								código: course.code,
								créditos: course.credits,
								tipologías: course.typologies,
							}"
						/>
					</div>
				</div>
				<div class="flx --flxColumn --flx-start --width-100">
					<div class="txt">
						<h4>Grupos ({{ course.groupCount || course.groups?.length || 0 }}):</h4>
					</div>
					<XamuTable
						:nodes="(course.groups || []).map(mapTableGroup)"
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

	import type { Course, Group, Teacher } from "~/resources/types/entities";
	import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
	import { eSIAPlace } from "~/functions/src/types/SIA";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		title: "Curso",
		middleware: ["auth-only"],
	});

	const SESSION = useSessionStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();

	const loading = ref(true);
	const course = ref<Course>();
	const fromSIA = ref<boolean>();
	const routeCourseId = computed(() => <string>route.params.courseId);

	// set course ref
	const courseRef = doc($clientFirestore, "courses", routeCourseId.value);

	const updatedAt = computed(() => {
		const date = new Date(course.value?.updatedAt || new Date());

		return useTimeAgo(date);
	});

	function mapTableGroup({
		name,
		activity,
		classrooms,
		teachers,
		schedule,
		spots,
		availableSpots,
	}: Group) {
		const reschedule = (schedule || []).map((interval) => {
			if (!interval) return;

			return interval.split("|").join(" a ");
		});

		const [lunes, martes, miercoles, jueves, viernes, sabado, domingo] = reschedule;

		return {
			nombre: `${name}ㅤ`, // hotfix to prevent it to parse as date
			cupos: `${availableSpots} de ${spots}`,
			actividad: activity,
			espacios: classrooms,
			profesores: teachers,
			horarios: { lunes, martes, miercoles, jueves, viernes, sabado, domingo },
		};
	}

	/**
	 * Get course from firebase, then SIA & reindex
	 */
	const unsub = onSnapshot(courseRef, (snapshot) => {
		if (!snapshot.exists()) {
			throw createError({
				statusCode: 404,
				statusMessage: "El curso que buscas no esta indexado o no existe",
			});
		}

		const firebaseCourse: Course = resolveSnapshotDefaults(snapshot.ref.path, snapshot.data());

		// Do once
		if (fromSIA.value === undefined) {
			const { id, code = "", place = eSIAPlace.BOGOTÁ } = firebaseCourse;

			// Get data from sia & reindex, do not await
			Promise.all([
				useSIACourses({ code, place }),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: [code] },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
			]).then(([{ data }, indexedTeachers]) => {
				const courses = data.map(useMapCourseFromSia);
				const SIACourse = courses.find((c) => c.id === id);

				if (!SIACourse) {
					fromSIA.value = false;

					return;
				}

				// refresh if same course
				if (SIACourse.code === course.value?.code) course.value = SIACourse;

				// Reindex, do not await
				return useIndexCourse({ ...SIACourse, indexed: true, indexedTeachers });
			});
		}

		course.value = firebaseCourse;
		loading.value = false;
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
	onBeforeUnmount(unsub);
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
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
