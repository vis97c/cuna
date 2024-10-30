<template>
	<section id="index" key="index" class="--width-100 --maxWidth-480">
		<XamuModal
			class="--txtColor --pY"
			title="Registrar curso"
			subtitle="Curso nuevo, no rastreado"
			invert-theme
		>
			<template #toggle="{ toggleModal }">
				<XamuBaseBox class="x-box flx --flxColumn --flx-start-stretch --p-20" transparent>
					<div class="--width">
						<XamuInputText
							id="search"
							v-model="search"
							placeholder="Nombre o codigo del curso..."
							icon="magnifying-glass"
							:size="eSizes.LG"
							class="--minWidth-100"
						/>
						<XamuActionLink
							v-if="search"
							class="x-search-reset"
							@click="() => (search = '')"
						>
							<XamuIconFa name="xmark" :size="20" />
						</XamuActionLink>
					</div>
					<div
						v-if="search && search.length >= 5"
						class="flx --flxColumn --flx-start-center --gap-5 --txtSize-xs"
					>
						<div
							v-if="!isCodeSearch"
							class="flx --flxRow --flx-start-center --gap-5 --width-100"
						>
							<div class="flx --flxColumn --flx-start --gap-5 --width-100">
								<p class="">Facultad</p>
								<XamuSelectFilter
									id="faculty"
									v-model="selectedFaculty"
									class="--width-180 --minWidth-100"
									:options="faculties"
									:size="eSizes.XS"
								/>
							</div>
							<div class="flx --flxColumn --flx-start --gap-5 --width-100">
								<p class="">Programa</p>
								<XamuSelectFilter
									id="program"
									v-model="selectedProgram"
									class="--width-180 --minWidth-100"
									:options="programs"
									:size="eSizes.XS"
									:disabled="!selectedFaculty || !programs.length"
								/>
							</div>
						</div>
						<div class="flx --flxColumn --flx-start --gap-5 --width-100">
							<p class="">Tipología</p>
							<XamuSelectFilter
								id="typology"
								v-model="selectedTypology"
								class="--width-180 --minWidth-100"
								:options="typologies"
								:size="eSizes.XS"
							/>
						</div>
					</div>
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
											<b title="Creditos">{{ match.credits || 0 }}</b>
											⋅
											<span title="Codigo">{{ match.code }}</span>
											⋅
											<span title="Tipologia">{{ match.typology }}</span>
										</p>
										<p>
											<template v-if="match.groups.length">
												<span>{{ tGroup(match.groups.length || 0) }}</span>
												⋅
											</template>
											<b>{{ tSpot(match.spotsCount || 0) }}</b>
											⋅
											<span
												:title="`Ultima actualizacion ${match.updatedAt}`"
											>
												{{ match.updatedAt }}
											</span>
										</p>
									</div>
								</div>
							</li>
						</ul>
						<p
							v-else-if="search.length >= 5 && !loading"
							class="--txtSize-xs --txtColor-dark5"
						>
							<b>La busqueda no coincide con ningun curso registrado</b>
						</p>
						<div class="txt --txtAlign-center --gap-0 --width-100">
							<p class="--txtSize-xs --txtColor-dark5">¿No encuentras tu curso?</p>
							<XamuActionLink @click="toggleModal">Busqueda avanzada</XamuActionLink>
						</div>
					</XamuLoaderContent>
				</XamuBaseBox>
			</template>
			<template #content="{ toggleModal }">
				<IndexCourses :close="() => toggleModal(false)" />
			</template>
		</XamuModal>
	</section>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import type { iPage } from "@open-xamu-co/ui-common-types";

	import type { Course } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { getDocumentId } from "~/resources/utils/firestore";
	import { eSIALevel, eSIAPlace } from "~/functions/src/types/SIA";

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

	const SESSION = useSessionStore();
	const router = useRouter();
	const { selectedPlace, selectedFaculty, selectedProgram, faculties, programs } =
		useCourseProgramOptions([eSIALevel.PREGRADO, eSIAPlace.BOGOTÁ]);
	const { selectedTypology, typologies } = useCourseTypeOptions();

	const search = ref<string>();
	const matches = ref<Course[]>([]);
	const loading = ref(false);
	const errors = ref();

	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));

	async function fetchCourses(query: Partial<CourseValues>) {
		const { edges } = await $fetch<iPage<Course, string>>("/api/courses/search", {
			query: { ...query, first: 30, page: true },
			cache: "no-cache",
			headers: { canModerate: SESSION.token || "" },
		});

		return edges.map(({ node }) => {
			return {
				...node,
				updatedAt: useTimeAgo(new Date(node.updatedAt || "")),
			};
		});
	}

	function tGroup(count: number) {
		const t = count === 1 ? "grupo" : "grupos";

		return `${count} ${t}`;
	}

	function tSpot(count: number) {
		const t = count === 1 ? "cupo" : "cupos";

		return `${count} ${t}`;
	}

	function goToCourse(course: Course) {
		router.push(`/curso/${getDocumentId(course.id)}`);
	}

	watch(
		[search, selectedFaculty, selectedProgram, selectedTypology],
		async ([newSearch, faculty, program, typology]) => {
			try {
				if (!newSearch || newSearch.length < 5) return;

				loading.value = true;
				errors.value = undefined;

				const payload: Partial<CourseValues> = {
					place: selectedPlace.value,
					faculty,
					program,
					typology,
				};

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
		.x-search-reset {
			position: absolute;
			top: 50%;
			right: 1rem;
			transform: translateY(-50%);
			z-index: 1;
		}
	}
</style>
