<template>
	<section id="index" key="index" class="--width-100 --maxWidth-980">
		<SearchCourse v-slot="{ searchCourse, searching }" :values="values">
			<XamuBaseBox
				class="x-box flx --flxColumn --flx-start-stretch --width-100 --p-20:md"
				transparent
			>
				<form
					action="#"
					method="post"
					class="flx --flxRow --flx-start-center --gap-5 --width-100"
					@submit.prevent="() => preventSearch(searchCourse)"
				>
					<div class="--flx">
						<XamuInputText
							id="search"
							v-model="search"
							placeholder="Nombre o codigo del curso..."
							autocomplete="off"
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
					<XamuActionButton
						:size="eSizes.LG"
						:disabled="!search || search.length < 5 || searching"
						type="submit"
						title="Buscar curso"
						round
					>
						<XamuIconFa name="arrow-right" :size="20" />
					</XamuActionButton>
				</form>
				<XamuLoaderContent
					class="flx --flxColumn --flx-start-center --width-100"
					:loading="loading"
					:errors="errors"
					:refresh="refresh"
					content
				>
					<div
						class="flx --flxRow-wrap --flx-start-center --gap-5 --txtSize-xs --width-100"
					>
						<template v-if="!isCodeSearch">
							<div class="flx --flxColumn --flx-start --flx --gap-5">
								<p class="">Facultad</p>
								<XamuSelect
									id="faculty"
									v-model="selectedFaculty"
									class="--width-180 --minWidth-100"
									:options="faculties"
									:size="eSizes.XS"
									required
								/>
							</div>
							<div class="flx --flxColumn --flx-start --flx --gap-5">
								<p class="">Programa</p>
								<XamuSelect
									id="program"
									v-model="selectedProgram"
									class="--width-180 --minWidth-100"
									:options="programs"
									:size="eSizes.XS"
									:disabled="!selectedFaculty || !programs.length"
									required
								/>
							</div>
						</template>
						<div class="flx --flxColumn --flx-start --flx --gap-5">
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
					<template v-if="search">
						<div
							v-if="matches.length"
							class="flx --flxColumn --flx-start-stretch --gap-10 --width-100"
						>
							<h4 class="--txtSize-xs">Sugerencias:</h4>
							<ul class="grd --grdColumns-auto3 --gap">
								<li
									v-for="match in matches"
									:key="match.code"
									class="txt --gap-0 --txtColor-dark5 --width-100"
								>
									<XamuActionLink
										class="--maxWidth-100"
										:tooltip="`Ver: ${match.name}`"
										tooltip-as-text
										:to="`/cursos/${getDocumentId(match.id)}`"
									>
										<XamuIconFa name="chess-knight" />
										<span class="--width-440 ellipsis">
											{{ match.name }}
										</span>
									</XamuActionLink>
									<div class="txt --txtSize-sm --gap-0 --width-100 --pLeft-20">
										<div
											class="flx --flxRow-wrap --flx-between-center --gap-5 --width-100"
										>
											<p>
												<b title="Código">{{ match.code }}</b>
												⋅
												<span title="Créditos">
													{{ useTCredits(match.credits) }}
												</span>
												<template v-if="match.groups?.length">
													⋅
													<span title="Grupos">
														{{ useTGroup(match.groups?.length) }}
													</span>
												</template>
											</p>
											<p>
												<b>{{ useTSpot(match.spotsCount) }}</b>
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
						</div>
						<p
							v-else-if="search.length >= 5 && !loading"
							class="--txtSize-xs --txtColor-dark5"
						>
							Sin sugerencias para
							<b>"{{ search }}"</b>
							.
						</p>
					</template>
				</XamuLoaderContent>
			</XamuBaseBox>
		</SearchCourse>
	</section>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import type { iPage } from "@open-xamu-co/ui-common-types";

	import type { Course } from "~/resources/types/entities";
	import type {
		CourseValues,
		CourseValuesWithCode,
		CourseValuesWithProgram,
		PartialCourseValues,
	} from "~/resources/types/values";
	import { getDocumentId } from "~/resources/utils/firestore";
	import { eSIALevel } from "~/functions/src/types/SIA";
	import { debounce } from "lodash-es";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Buscador",
		title: "Buscador de cursos",
		middleware: ["auth-only"],
	});

	const SESSION = useSessionStore();

	const selectedPlace = computed({
		get: () => SESSION.place,
		set: (value) => {
			SESSION.setPlace(value);
		},
	});

	const { selectedFaculty, selectedProgram, faculties, programs } = useCourseProgramOptions(
		[eSIALevel.PREGRADO, selectedPlace, SESSION.lastFacultySearch, SESSION.lastProgramSearch],
		true
	);
	const { selectedTypology, typologies } = useCourseTypeOptions();

	const search = ref<string>();
	const matches = ref<Course[]>([]);
	const loading = ref(false);
	const errors = ref();

	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));
	const values = computed<CourseValues>(() => {
		const payload: PartialCourseValues = {
			place: selectedPlace.value,
			typology: selectedTypology.value,
		};

		const searchValue = (search.value || "").trim();

		if (isCodeSearch.value) return <CourseValuesWithCode>{ ...payload, code: searchValue };

		return <CourseValuesWithProgram>{
			...payload,
			name: searchValue,
			faculty: selectedFaculty.value,
			program: selectedProgram.value,
		};
	});

	const preventSearch = debounce((fn: () => any) => {
		if (!search.value || search.value.length < 5) return;

		return fn();
	});

	function refresh() {
		const saveSearch = search.value;

		search.value = "";
		search.value = saveSearch;
	}

	async function fetchCourses(
		{ faculty, ...query }: Partial<CourseValues> = values.value
	): Promise<Course[]> {
		const page = await $fetch<iPage<Course, string>>("/api/courses/search", {
			query: { ...query, first: 6, page: true },
			cache: "no-cache",
			headers: { canModerate: SESSION.token || "" },
		});
		const courses: Course[] = [];

		for (let index = 0; index < page.edges.length; index++) {
			const { node } = page.edges[index];

			// Remove courses with no groups, do not await
			if (!node.groups?.length) useDocumentDelete(node);
			else {
				const course = useMapCourse({
					...node,
					updatedAt: useTimeAgo(new Date(node.updatedAt || "")),
				});

				courses.push(course);
			}
		}

		return courses;
	}

	watch(
		[search, values],
		debounce(async ([newSearch, newValues]) => {
			try {
				if (!newSearch || newSearch.length < 5) return;

				loading.value = true;
				errors.value = undefined;
				// get new suggestions
				matches.value = await fetchCourses(newValues);
				loading.value = false;
			} catch (err) {
				console.error(err);
				errors.value = err;
				matches.value = [];
				loading.value = false;
			}
		}, 300),
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
