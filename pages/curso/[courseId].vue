<template>
	<section id="course" :key="routeCourseId" class="--width-100">
		<XamuLoaderContentFetch
			v-slot="{ content }"
			class="x-course flx --flxColumn --flx-start --gap-30"
			el="section"
			:url="`api:courses:${routeCourseId}`"
			:payload="[routeCourseId]"
			:hydratable-promise="hydrateAndFetchCourse"
		>
			<div class="txt">
				<h2 :key="content.id">{{ content.name }}</h2>
				<p class="">Actualizado {{ useTimeAgo(new Date(content.updatedAt || "")) }}</p>
			</div>
			<div v-if="SESSION.canModerate && !fromSIA" class="txt">
				<p class="">El curso contiene datos erroneos y no se pudo reindexar</p>
				<XamuActionButton :theme="eColors.DANGER" @click="() => removeCourse(content)">
					Eliminar
				</XamuActionButton>
			</div>
			<div class="grd --grdColumns-auto2 --gap">
				<div class="grd-item">
					<XamuValueList
						:value="{
							sede: content.place,
							facultad: content.faculty,
							programa: content.program || 'No reportado',
							cuposDisponibles: useCountSpots(content),
						}"
					/>
				</div>
				<div class="grd-item">
					<XamuValueList
						:value="{
							código: content.code,
							créditos: content.credits,
							tipología: content.typology,
						}"
					/>
				</div>
			</div>
			<div class="flx --flxColumn --flx-start --width-100">
				<div class="txt">
					<h4>Grupos ({{ content.groupCount || content.groups?.length || 0 }}):</h4>
				</div>
				<XamuTable
					:nodes="content.groups || []"
					:modal-props="{ class: '--txtColor', invertTheme: true }"
					class=""
				/>
			</div>
		</XamuLoaderContentFetch>
	</section>
</template>

<script setup lang="ts">
	import type { iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import { eSIATypology } from "~/functions/src/types/SIA";
	import type { Course, Teacher } from "~/resources/types/entities";
	import { debounce } from "lodash-es";

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

	const fromSIA = ref(true);
	const routeCourseId = computed(() => <string>route.params.courseId);

	const removeCourse = debounce(async (course: Course) => {
		if (!SESSION.canModerate) return;

		const removed = await useDocumentDelete(course);

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

	/**
	 * Get course from firebase, then SIA & reindex
	 */
	function hydrateAndFetchCourse(toHydrate: Ref<Course | null | undefined>) {
		return async (courseId?: string) => {
			const firebaseCourse = await $fetch<Course>(`/api/all/courses/${courseId}`, {
				cache: "no-cache",
				headers: { canModerate: SESSION.token || "" },
			});

			if (!firebaseCourse) throw new Error("El curso que buscas no existe");

			const {
				id,
				program,
				code = "",
				typology = eSIATypology.LIBRE_ELECCIÓN,
			} = firebaseCourse;

			// Get data from sia & reindex, do not await
			Promise.all([
				useSIACourses({ program, code, typology }),
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
				if (SIACourse.code === toHydrate.value?.code) toHydrate.value = SIACourse;

				// Reindex, do not await
				return useIndexCourse({ ...SIACourse, indexed: true, indexedTeachers });
			});

			return firebaseCourse;
		};
	}
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
