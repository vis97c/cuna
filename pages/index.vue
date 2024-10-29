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
					class="--minWidth-100"
				/>
				<XamuLoaderContent
					v-if="search"
					class="flx --flxColumn --flx-start-center --width-100"
					:loading="loading"
					:errors="errors"
					content
				>
					<ul
						v-if="matches.length"
						class="flx --flxColumn --flx-start --gap-10 --width-100"
					>
						<li
							v-for="match in matches"
							:key="match.code"
							class="txt --gap-0 --txtColor-dark5 --width-100"
						>
							<XamuActionLink
								:tooltip="`Ver: ${match.name}`"
								tooltip-as-text
								@click="() => goToCourse(match)"
							>
								<XamuIconFa name="chess-knight" />
								<span class="--maxWidth-440 ellipsis">
									{{ match.name }}
								</span>
							</XamuActionLink>
							<div class="txt --gap-0 --width-100 --pLeft-20">
								<p v-if="match.program" class="--txtSize-sm">
									<span title="Programa">{{ match.program }}</span>
								</p>
								<div
									class="flx --flxRow --flx-between-center --width-100 --txtSize-xs"
								>
									<p>
										<b title="Creditos">{{ match.credits }}</b>
										⋅
										<span title="Codigo">{{ match.code }}</span>
										⋅
										<span title="Tipologia">{{ match.typology }}</span>
									</p>
									<p :title="`Ultima actualizacion ${match.updatedAt}`">
										{{ match.updatedAt }}
									</p>
								</div>
							</div>
						</li>
					</ul>
					<p
						v-else-if="search.length >= 3 && !loading"
						class="--txtSize-xs --txtColor-dark5"
					>
						La busqueda no coincide con ningun curso registrado
					</p>
					<div class="txt --txtAlign-center --gap-0 --width-100">
						<p class="--txtSize-xs --txtColor-dark5">¿No encuentras tu curso?</p>
						<XamuActionLink @click="toggleModal">Busqueda avanzada</XamuActionLink>
					</div>
				</XamuLoaderContent>
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

	const router = useRouter();

	const search = ref<string>();
	const matches = ref<Course[]>([]);
	const loading = ref(false);
	const errors = ref();

	async function fetchCourses(query: { code?: string; name?: string }) {
		const edges = await $fetch<iPageEdge<Course, string>[]>("/api/courses/search", { query });

		return edges.map(({ node }) => {
			return {
				...node,
				updatedAt: useTimeAgo(new Date(node.updatedAt || "")),
			};
		});
	}

	function goToCourse(course: Course) {
		router.push(`/curso/${course.code}`);
	}

	watch(
		search,
		async (newSearch) => {
			try {
				if (!newSearch || newSearch.length < 3) return;

				loading.value = true;
				errors.value = undefined;

				const payload: { code?: string; name?: string } = {};

				// Search by course name or code
				if (/^\d/.test(newSearch)) payload.code = newSearch;
				else payload.name = newSearch;

				matches.value = await fetchCourses(payload);
				loading.value = false;
			} catch (err) {
				console.error(err);
				errors.value = err;
				matches.value = [];
				loading.value = false;
			}
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
