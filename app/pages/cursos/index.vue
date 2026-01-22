<template>
	<div id="course" class="view --gap-none">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center">
				<div class="txt --txtAlign-center">
					<h1 class="--txtLineHeight-sm">Cursos</h1>
					<p>Encuentra cursos útiles o que te llamen la atención.</p>
				</div>
				<div
					class="flx --flxColumn --flx-start --gap-5 --width-100 --maxWidth-220 --txtSize-xs"
				>
					<p class="">Tipología</p>
					<XamuSelect
						id="typology"
						v-model="selectedTypology"
						class="--width-180 --minWidth-100"
						:options="typologies"
						:size="eSizes.XS"
					/>
				</div>
				<ClientOnly>
					<template #fallback>Cargando notas...</template>
					<XamuPaginationContent
						v-slot="{ content }"
						:page="coursesPage"
						url="api:instance:all:courses"
						:defaults="{ page: true, ...values }"
						no-content-message="No hay cursos guardados, puedes usar el buscador."
						label="Cargando cursos guardados..."
						class="flx --flxColumn --flx-start-center --gap-30 --width-100 --maxWidth-770"
						hide-controls="single"
						with-route
						client
					>
						<div class="grd --grdColumns-auto3 --gap-20 --width-100">
							<ItemCourse
								v-for="course in content"
								:key="course.id"
								:course="course"
								class="grd-item"
							/>
							<XamuBaseBox
								v-for="i in (3 - (content.length % 3)) % 3"
								:key="i"
								class="x-course-placeholder --width-100 --height-100"
								hidden=":md-inv"
								disabled
								button
							/>
						</div>
					</XamuPaginationContent>
				</ClientOnly>
				<div class="txt --txtAlign-center --txtSize-xs --txtColor-dark5 --minWidth-100">
					<p>Usa el buscador para obtener cursos actualizados desde el SIA.</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, PartialCourseValues } from "~/utils/types";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({ title: "Cursos", middleware: ["enabled", "auth-only"] });

	const USER = useUserStore();
	const { cache } = useRuntimeConfig().public;

	const selectedLevel = computed({
		get: () => USER.level,
		set: (value) => {
			USER.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => USER.place,
		set: (value) => {
			USER.setPlace(value);
		},
	});
	const { selectedTypology, typologies } = useCourseTypeOptions();
	const values = computed<PartialCourseValues>(() => ({
		level: selectedLevel.value,
		place: selectedPlace.value,
		typology: selectedTypology.value,
	}));

	const coursesPage: iGetPage<Course> = (pagination) => {
		return useCsrfQuery<iPage<Course> | undefined>("/api/instance/courses", {
			method: "POST",
			query: pagination,
			headers: { "Cache-Control": cache.frequent },
			cache: "reload",
		});
	};
</script>
