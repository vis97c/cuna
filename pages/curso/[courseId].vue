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
			</div>
			<div class="grd --grdColumns-auto2">
				<div class="grd-item">
					<XamuValueList
						:value="{
							sede: content.place,
							facultad: content.faculty,
							programa: content.program || 'No reportado',
							cuposDisponibles: content.groupCount || content.groups?.length || 0,
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
	import { eSIATypology } from "~/functions/src/types/SIA";
	import type { Course, Teacher } from "~/resources/types/entities";

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
	const route = useRoute();

	const routeCourseId = computed(() => <string>route.params.courseId);

	/**
	 * Get course from firebase, then SIA & reindex
	 */
	function hydrateAndFetchCourse(toHydrate: Ref<Course | null | undefined>) {
		return async (courseId?: string) => {
			const firebaseCourse = await $fetch<Course>(`/api/all/courses/${courseId}`, {
				cache: "no-cache",
				headers: { canModerate: SESSION.token || "" },
			});

			const { id, code = "", typology = eSIATypology.LIBRE_ELECCIÓN } = firebaseCourse;

			// Get data from sia & reindex, do not await
			Promise.all([
				useSIACourses({ code, typology }),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: [code] },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
			]).then(([{ data }, indexedTeachers]) => {
				const courses = data.map(useMapCourseFromSia);
				const SIACourse = courses.find((c) => c.id === id);

				if (!SIACourse) return;

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
	}
</style>
