<template>
	<XamuLoaderContent
		class="flx --flxColumn --flx-start-center --gap-30:sm --width-100"
		:loading="searching"
		:errors="errors"
		content
	>
		<slot v-bind="{ searchCourse: resetSearchCourse, searching }"></slot>
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
	import { isEqual, omit } from "lodash-es";
	import type { iPageEdge } from "@open-xamu-co/ui-common-types";

	import { XamuBaseAction } from "#components";
	import type { Course } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { type CoursesResponse } from "~/functions/src/types/SIA";
	import { getDocumentId } from "~/resources/utils/firestore";

	/**
	 * Registering unindexed courses
	 *
	 * @component
	 */

	const props = defineProps<{ values: CourseValues; disabled?: boolean }>();

	const Swal = useSwal();

	const searchUntrackedRef = ref<HTMLElement>();
	const searching = ref(false);
	const errors = ref();
	const untrackedCurrentPage = ref<CoursesResponse<Course>>();
	const untrackedCourses = ref<Course[]>();
	const savedUntrackedCourses = ref<Record<number, Course[]>>({});
	const lastSearch = ref<CourseValues & { page?: number }>();

	/**
	 * Omit pagination if user makes a different search
	 */
	const canPaginate = computed(() => {
		if (!untrackedCurrentPage.value || !isEqual(omit(lastSearch.value, "page"), props.values)) {
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
		if (props.disabled || isEqual(lastSearch.value, props.values)) return;

		searching.value = true;
		errors.value = undefined;

		try {
			const coursesPage = await useExplorerV2Courses(props.values);

			// Refresh UI
			lastSearch.value = { ...props.values, page: coursesPage.currentPage };
			untrackedCourses.value = coursesPage.data;
			untrackedCurrentPage.value = coursesPage;
			savedUntrackedCourses.value[coursesPage.currentPage] = coursesPage.data;

			// Index course, do not await
			indexCourses(coursesPage.data, coursesPage);
		} catch (err) {
			useLogger("components:SearchCourse", err);
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
			const indexedCoursesEdges = await useFetchQuery<iPageEdge<Course, string>[]>(
				"/api/all/courses",
				{ include }
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
			useLogger("components:SearchCourse:indexCourses", err);
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
