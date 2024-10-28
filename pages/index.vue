<template>
	<XamuModal
		id="landing"
		key="landing"
		class="--txtColor --pY"
		title="Registrar curso"
		subtitle="Curso nuevo, no rastreado"
		hide-footer
		invert-theme
	>
		<template #toggle="{ toggleModal }">
			<XamuBaseBox transparent class="x-box flx --flxColumn --flx-start-stretch --p-20">
				<XamuInputText
					v-model="search"
					placeholder="Nombre o codigo del curso..."
					icon="magnifying-glass"
					:size="eSizes.LG"
				/>
				<div v-if="search" class="flx --flxColumn --flx-start">
					<div class="txt --txtAlign-center --gap-0 --width-100">
						<p class="--txtSize-xs --txtColor-dark5">¿No encuentras tu curso?</p>
						<XamuActionLink @click="toggleModal">Busqueda avanzada</XamuActionLink>
					</div>
				</div>
			</XamuBaseBox>
		</template>
		<template #default="{ toggleModal }">
			<IndexCourses :close="() => toggleModal(false)" />
		</template>
	</XamuModal>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import type { iPageEdge } from "@open-xamu-co/ui-common-types";

	import type { Course } from "~/resources/types/entities";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Inicio",
		title: "Inicio",
		middleware: ["auth-only"],
	});

	const search = ref<string>();
	const matches = ref<Course[]>();

	async function fetchCourses(query: { code?: string; name?: string }) {
		const edges = await $fetch<iPageEdge<Course, string>[]>("/api/courses/search", { query });

		return edges.map(({ node }) => node);
	}

	watch(
		search,
		async (newSearch) => {
			if (!newSearch || newSearch.length <= 3) return;

			const payload: { code?: string; name?: string } = {};

			// Search by course name or code
			if (/^\d/.test(newSearch)) payload.code = newSearch;
			else payload.name = newSearch;

			matches.value = await fetchCourses(payload);
		},
		{ immediate: false }
	);
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-box {
			border-radius: 2rem;
		}
	}
</style>
