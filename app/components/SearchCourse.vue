<template>
	<XamuLoaderContent
		class="flx --flxColumn --flx-start-center --gap-30:sm --width-100 --maxWidth-980"
		:loading="searching"
		:errors="errors"
		content
	>
		<XamuBaseBox
			class="x-box flx --flxColumn --flx-start-stretch --width-100 --p-20:md"
			transparent
		>
			<ClientOnly>
				<form
					action="#"
					method="post"
					class="flx --flxRow --flx-start-center --gap-5 --width-100"
					@submit.prevent="resetSearchCourse"
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
						:disabled="!USER.token || disabledExplorerSearch || searching"
						type="submit"
						:tooltip="search ? 'Buscar curso' : 'Descubrir cursos disponibles'"
						round
					>
						<XamuIconFa v-if="search" name="magnifying-glass" :size="20" />
						<XamuIconFa v-else name="wand-magic-sparkles" :size="20" />
					</XamuActionButton>
				</form>
				<XamuLoaderContent
					class="flx --flxColumn --flx-start-center --width-100"
					:loading="loading"
					:errors="error"
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
						<div
							v-if="!CUNA.config?.explorerV2MaintenanceTillAt"
							class="flx --flxColumn --flx-start --flx --gap-5"
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
					</div>
					<template v-if="search">
						<div
							v-if="matches?.length"
							class="flx --flxColumn --flx-start-stretch --gap-10 --width-100"
						>
							<h4 class="--txtSize-xs">Sugerencias de búsquedas:</h4>
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
			</ClientOnly>
		</XamuBaseBox>
		<div
			v-if="untrackedCurrentPage"
			class="flx --flxColumn --flx-start-stretch --gap-30 --width-100"
		>
			<div class="flx --flxColumn --flx-start-stretch --gap-30 --width-100">
				<div class="txt">
					<div>
						<h3>
							Resultados de la búsqueda
							<template v-if="lastSearch?.name || lastSearch?.code">
								de "{{ lastSearch?.name || lastSearch?.code }}"
							</template>
							:
						</h3>
						<p class="--txtSize-xs">Datos obtenidos del explorador de cursos.</p>
					</div>
					<p>
						{{ untrackedCurrentPage.totalRecords }} resultados. Pagina
						{{ untrackedCurrentPage.currentPage }} de
						{{ untrackedCurrentPage.totalPages }}.
					</p>
				</div>
				<div
					v-if="untrackedCourses?.length"
					class="grd --grdColumns-auto3 --gap --width-100"
				>
					<XamuLoaderContent
						v-for="course in untrackedCourses"
						:key="course.code"
						:loading="!course.indexed"
						content
					>
						<XamuBaseBox
							:el="XamuBaseAction"
							class="grd-item txt --txtAlign-left --txtSize-sm --gap-5"
							title="Ver detalles del curso"
							:disabled="!course.indexed"
							:to="`/cursos/${getDocumentId(course.id)}`"
							button
						>
							<p class="--maxWidth-220 ellipsis">{{ course.name }}</p>
							<div
								class="txt --txtSize-xs --txtWrap --txtWeight-regular --gap-0 --flx"
							>
								<p>
									<b title="Codigo">{{ course.code }}</b>
									⋅
									<span title="Creditos">{{ useTCredits(course.credits) }}</span>
									⋅
									<span v-if="course.scrapedAt" title="Cupos disponibles">
										{{ useTSpot(course.spotsCount) }}
									</span>
									<span v-else title="Cupos disponibles">
										Abrir para obtener los cupos
									</span>
								</p>
								<p v-if="course.programs?.length" title="Programas">
									{{ course.programs.join(", ") }}.
								</p>
								<p v-if="course.typologies?.length" title="Tipologías">
									{{ course.typologies.join(", ") }}.
								</p>
							</div>
							<div
								v-if="course.indexed"
								class="flx --flxRow --flx-end-center --width-100"
							>
								<XamuIconFa name="arrow-right" />
							</div>
						</XamuBaseBox>
					</XamuLoaderContent>
				</div>
				<XamuBoxMessage
					v-else-if="canPaginate"
					text="Se omitieron los resultados por no tener grupos reportados (Sin disponibilidad)."
				/>
				<XamuBoxMessage v-else>
					<div class="txt --txtAlign-center --gap-10 --width-100">
						<p v-if="untrackedCurrentPage.totalRecords" class="--txtSize-xs">
							*Se omitieron los resultados por no tener grupos reportados (Sin
							disponibilidad).
						</p>
						<p>
							Aparentemente no hay cursos disponibles de la UNAL
							<b>"{{ lastSearch?.place }}"</b>
							que coincidan con tu búsqueda.
						</p>
					</div>
				</XamuBoxMessage>
			</div>
			<div v-if="canPaginate" class="flx --flxRow --flx-between-center">
				<XamuActionButtonToggle
					:disabled="untrackedCurrentPage.currentPage <= 1"
					@click="untrackedCurrentPage.currentPage--"
				>
					<XamuIconFa name="chevron-left" />
					<XamuIconFa name="chevron-left" />
					<span>Anterior</span>
				</XamuActionButtonToggle>
				<XamuActionButtonToggle
					:disabled="untrackedCurrentPage.currentPage >= untrackedCurrentPage.totalPages"
					@click="untrackedCurrentPage.currentPage++"
				>
					<span>Siguiente página</span>
					<XamuIconFa name="chevron-right" />
					<XamuIconFa name="chevron-right" />
				</XamuActionButtonToggle>
			</div>
		</div>
	</XamuLoaderContent>
</template>

<script setup lang="ts">
	import isEqual from "lodash-es/isEqual";
	import omit from "lodash-es/omit";

	import type { iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";

	import type { Course } from "~/utils/types";
	import type {
		CourseValues,
		CourseValuesWithCode,
		CourseValuesWithProgram,
		PartialCourseValues,
	} from "~/utils/types/values";
	import { type CoursesResponse } from "~~/functions/src/types/SIA";

	import { XamuBaseAction } from "#components";

	/**
	 * Registering unindexed courses
	 *
	 * @component
	 */

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const Swal = useSwal();

	const search = ref<string>();
	const searchUntrackedRef = ref<HTMLElement>();
	const searching = ref(false);
	const errors = ref();
	const untrackedCurrentPage = ref<CoursesResponse<Course>>();
	const untrackedCourses = ref<Course[]>();
	const savedUntrackedCourses = ref<Record<number, Course[]>>({});
	const lastSearch = ref<CourseValues & { page?: number }>();
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
	const { selectedFaculty, selectedProgram, faculties, programs } = useCourseProgramOptions(
		[selectedLevel, selectedPlace, USER.lastFacultySearch, USER.lastProgramSearch],
		true
	);
	const { selectedTypology, typologies } = useCourseTypeOptions();
	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));
	const values = computed<CourseValues>(() => {
		const payload: PartialCourseValues = {
			level: selectedLevel.value,
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

	/**
	 * Disable Explorer search
	 */
	const disabledExplorerSearch = computed(() => {
		return CUNA.ExplorerV2Maintenance || (!!search.value && search.value.length < 5);
	});

	const {
		data: matches,
		pending: loading,
		refresh,
		error,
	} = useAsyncData<Course[]>(
		async () => {
			if (!search.value || search.value.length < 5) return [];

			const { faculty, ...query } = values.value;
			const edges = await useQuery<iPageEdge<Course>[]>("/api/instance/courses/search", {
				query: { ...query, first: 6 },
			});
			const courses: Course[] = [];

			for (let index = 0; index < edges.length; index++) {
				const { node } = edges[index];

				if (!node.groups?.length) continue;

				const course = useMapCourse({
					...node,
					updatedAt: useTimeAgo(new Date(node.scrapedAt || node.updatedAt || "")),
				});

				courses.push(course);
			}

			return courses;
		},
		{ watch: [search, values], server: false, default: () => [] }
	);

	/**
	 * Omit pagination if user makes a different search
	 */
	const canPaginate = computed(() => {
		if (!untrackedCurrentPage.value || !isEqual(omit(lastSearch.value, "page"), values.value)) {
			return false;
		}

		return untrackedCurrentPage.value.totalPages > 1;
	});

	function resetSearchCourse() {
		if (untrackedCurrentPage.value) {
			savedUntrackedCourses.value = {};
			untrackedCurrentPage.value = undefined;
		}

		return searchCourse();
	}

	async function searchCourse() {
		// prevent same search
		if (
			!USER.token ||
			disabledExplorerSearch.value ||
			isEqual(lastSearch.value, values.value)
		) {
			return;
		}

		searching.value = true;
		errors.value = undefined;

		try {
			const coursesPage = await useExplorerV2Courses(values.value);

			// Refresh UI
			lastSearch.value = { ...values.value, page: coursesPage.currentPage };
			untrackedCourses.value = coursesPage.data;
			untrackedCurrentPage.value = coursesPage;
			savedUntrackedCourses.value[coursesPage.currentPage] = coursesPage.data;

			// Index course, do not await
			indexCourses(coursesPage.data, coursesPage);
		} catch (err) {
			useAppLogger("components:SearchCourse", err);
			errors.value = err;

			Swal.fire({
				title: "Error de busqueda",
				text: "Ha ocurrido un error al buscar el curso",
				icon: "error",
				target: searchUntrackedRef.value,
			});
		}

		searching.value = false;
	}

	/**
	 * Index unindexed courses
	 */
	async function indexCourses(courses: Course[], page: CoursesResponse<Course>) {
		try {
			const include = courses.map(({ id }) => id);
			const indexedCoursesEdges = await useQuery<iPageEdge<Course, string>[]>(
				"/api/instance/all/courses",
				{ query: { include } }
			);

			const mappedCourses: (Course & { indexed?: Course })[] = courses.map((course) => {
				const indexed = indexedCoursesEdges.find(({ node }) => node.id === course.id)?.node;

				return { ...course, indexed };
			});

			// Conditionally Refresh UI again
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = mappedCourses;
				savedUntrackedCourses.value[page.currentPage] = mappedCourses;
			}

			// Index or update courses
			const allIndexed = await Promise.all(
				mappedCourses.map(async ({ indexed, ...course }) => {
					// Force array type
					if (indexed?.programs && !Array.isArray(indexed?.programs)) {
						indexed.programs = [];
					}

					// Set course
					await useIndexCourse(course, indexed);

					return {
						...course,
						spotsCount: indexed?.spotsCount || course.spotsCount,
						groupCount: indexed?.groupCount || course.groupCount,
						groups: indexed?.groups || course.groups,
						updatedAt: indexed?.updatedAt,
						scrapedAt: indexed?.scrapedAt,
						indexed: true,
					};
				})
			);

			// Conditionally Refresh UI again, 2nd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = allIndexed;
				savedUntrackedCourses.value[page.currentPage] = allIndexed;
			}
		} catch (err) {
			useAppLogger("components:SearchCourse:indexCourses", err);
			errors.value = err;

			Swal.fire({
				title: "Error de indexado",
				text: "Ha ocurrido un error al indexar los cursos",
				icon: "error",
				target: searchUntrackedRef.value,
			});
		}
	}

	// lifecycle
	watch(
		[untrackedCourses, () => untrackedCurrentPage?.value?.currentPage],
		([newCourses, newPageNumber], [oldCourses, oldPageNumber]) => {
			// omit if first load or reset
			if (!oldCourses || !oldPageNumber || !newCourses || !newPageNumber) return;

			// page change
			if (newPageNumber > oldPageNumber) {
				const saved = savedUntrackedCourses.value[newPageNumber];

				// fetch new page
				if (!saved) return searchCourse();

				// replace with saved page
				untrackedCourses.value = saved;
			} else if (newPageNumber < oldPageNumber) {
				// replace with old page
				untrackedCourses.value = savedUntrackedCourses.value[newPageNumber] || [];
			}
		},
		{ immediate: false }
	);
</script>

<style lang="scss">
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
		.x-items li {
			max-width: 14ch;
			p {
				white-space: normal;
				font-size: 1em;
			}
		}
	}
</style>
