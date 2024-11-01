<template>
	<XamuLoaderContent
		class="flx --flxColumn --flx-start-stretch --width-100 --pX"
		:loading="loading"
		:errors="errors"
		content
	>
		<div class="scroll --vertical --maxWidth-1080 --maxHeightVh-60">
			<div class="flx --flxColumn --flx-start-stretch --width-100">
				<template v-if="untrackedCurrentPage && untrackedCourses?.length">
					<div class="txt --gap-0">
						<h3>Resultados de la busqueda:</h3>
						<p class="--txtSize-xs">
							{{ untrackedCurrentPage.totalRecords }} resultados. Pagina
							{{ untrackedCurrentPage.currentPage }} de
							{{ untrackedCurrentPage.totalPages }}.
						</p>
					</div>
					<div
						v-if="untrackedCurrentPage.totalPages > 1"
						class="flx --flxRow --flx-start-center"
					>
						<XamuActionButtonToggle
							:disabled="untrackedCurrentPage.currentPage <= 1"
							@click="untrackedCurrentPage.currentPage--"
						>
							<XamuIconFa name="chevron-left" />
							<XamuIconFa name="chevron-left" />
							<span>Anterior</span>
						</XamuActionButtonToggle>
						<XamuActionButtonToggle
							:disabled="
								untrackedCurrentPage.currentPage >= untrackedCurrentPage.totalPages
							"
							@click="untrackedCurrentPage.currentPage++"
						>
							<span>Siguiente página</span>
							<XamuIconFa name="chevron-right" />
							<XamuIconFa name="chevron-right" />
						</XamuActionButtonToggle>
					</div>
					<div class="flx --flxRow-wrap --flx-start --gap-5 --width-100">
						<XamuBaseBox
							v-for="course in untrackedCourses"
							:key="course.code"
							class="txt --txtAlign-left --txtSize-sm --gap-5"
							el="button"
							:title="course.name"
							button
						>
							<p class="--maxWidth-220 ellipsis">{{ course.name }}</p>
							<div class="txt --txtSize-xs --txtWeight-regular --gap-0">
								<p>
									<b title="Creditos">{{ course.credits || 0 }}</b>
									⋅
									<span title="Codigo">{{ course.code }}</span>
									⋅
									<b title="Cupos disponibles">
										{{ useTSpot(useCountSpots(course)) }}
									</b>
								</p>
								<p v-if="course.typologies?.length" title="Tipologias">
									{{ course.typologies.join(", ") }}.
								</p>
							</div>
							<XamuActionButton
								:size="eSizes.SM"
								:disabled="!course.indexed"
								:to="`/curso/${getDocumentId(course.id)}`"
							>
								<span>Ver detalles</span>
								<XamuIconFa name="chevron-right" :size="15" />
							</XamuActionButton>
						</XamuBaseBox>
					</div>
				</template>
				<div v-else class="">
					<XamuBoxMessage
						v-if="untrackedCurrentPage"
						text="Definitivamente no hay cursos de la UNAL que coincidan con tu búsqueda."
					/>
					<form
						v-else
						class="flx --flxColumn --flx-start --gap-30"
						action="#"
						method="post"
					>
						<p class="--txtSize-xs --txtColor-dark5">* Este campo es requerido.</p>
						<div
							class="flx --flxColumn --flx-start-stretch --width-100 --minWidthVw-30 --maxWidth-100"
						>
							<XamuForm
								v-model="untrackedCourseInputs"
								v-model:invalid="untrackedInvalid"
								no-form
							/>
						</div>
					</form>
				</div>
			</div>
		</div>
		<div class="flx --flxRow --flx-between-center">
			<div ref="searchUntrackedRef" class="flx --flxRow --flx-start-center">
				<XamuActionButton
					v-if="!untrackedCurrentPage"
					type="submit"
					@click.prevent="searchUntrackedCourse"
				>
					<XamuIconFa name="magnifying-glass" />
					<span>Buscar curso</span>
				</XamuActionButton>
				<template v-else>
					<XamuActionLink @click="reset">
						<XamuIconFa name="chevron-left" />
						<span>Buscar otro</span>
					</XamuActionLink>
				</template>
			</div>
			<XamuActionButtonToggle @click="props.close">Cerrar</XamuActionButtonToggle>
		</div>
	</XamuLoaderContent>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";
	import type { iInvalidInput, iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, Teacher } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { type SIACoursesResponse } from "~/functions/src/types/SIA";
	import { getDocumentId } from "~/resources/utils/firestore";

	/**
	 * Registering unindexed courses
	 *
	 * @component
	 */

	const props = defineProps<{ close?: () => void }>();

	const SESSION = useSessionStore();
	const Swal = useSwal();
	const { utils } = useFormInput();

	const searchUntrackedRef = ref<HTMLElement>();
	const loading = ref(false);
	const errors = ref();
	const untrackedInvalid = ref<iInvalidInput[]>([]);
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const untrackedCourseInputs = ref(markRaw(useCourseInputs()));
	const untrackedCurrentPage = ref<SIACoursesResponse>();
	const untrackedCourses = ref<Course[]>();
	const savedUntrackedCourses = ref<Record<number, Course[]>>({});

	const reset = debounce((partial = true) => {
		untrackedCurrentPage.value = undefined;
		untrackedInvalid.value = [];
		untrackedCourses.value = undefined;
		savedUntrackedCourses.value = {};

		if (partial) return;

		untrackedCourseInputs.value = useCourseInputs();
	});

	const searchUntrackedCourse = debounce(async () => {
		loading.value = true;
		errors.value = undefined;

		try {
			const { values, invalidInputs } = utils.getFormValues<CourseValues>(
				untrackedCourseInputs.value
			);

			if (invalidInputs.length) {
				untrackedInvalid.value = invalidInputs;
				loading.value = false;

				return;
			}

			const coursesPage = await useSIACourses(
				values,
				untrackedCurrentPage.value?.currentPage
			);
			const codes: string[] = [];
			/**
			 * Remove duplicates
			 * The system return entities with the same data but differing in the internal id
			 */
			const dedupedCourses: Course[] = coursesPage.data
				.map(useMapCourseFromSia)
				.filter((course) => {
					if (!course.code || codes.includes(course.code)) return false;

					codes.push(course.code);

					return true;
				});

			// Refresh UI
			untrackedCourses.value = dedupedCourses;
			untrackedCurrentPage.value = coursesPage;
			savedUntrackedCourses.value[coursesPage.currentPage] = dedupedCourses;

			// Index course, do not await
			indexCourses(dedupedCourses, coursesPage);
		} catch (err) {
			console.error(err);
			errors.value = err;

			Swal.fire({
				title: "Error de busqueda",
				text: "Ha ocurrido un error al buscar el curso",
				icon: "error",
				target: searchUntrackedRef.value,
			});
		}

		loading.value = false;
	});

	async function indexCourses(courses: Course[], page: SIACoursesResponse) {
		try {
			const include = courses.map(({ id }) => id);
			const indexedCoursesEdges = await $fetch<iPageEdge<Course, string>[]>(
				"/api/all/courses",
				{
					query: { include },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}
			);
			const mappedCourses: (Course & { indexed: boolean })[] = courses.map((course) => {
				// With typology to prevent false matches
				const indexedCourse = indexedCoursesEdges.find(({ node }) => node.id === course.id);

				return {
					...course,
					indexed: !!indexedCourse,
					updatedAt: indexedCourse?.node?.updatedAt,
				};
			});

			// Conditionally Refresh UI again, 2nd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = mappedCourses;
			}

			savedUntrackedCourses.value[page.currentPage] = mappedCourses;

			const coursesCodes = courses.map(({ code }) => code);
			const indexedTeacherEdges = await $fetch<iPageEdge<Teacher, string>[]>(
				"/api/teachers/search",
				{
					query: { courses: coursesCodes },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}
			);
			const indexedTeachers = indexedTeacherEdges.map(({ node }) => node);

			// Index courses
			await Promise.all(
				mappedCourses.map((course) => useIndexCourse({ ...course, indexedTeachers }))
			);

			const allIndexed = mappedCourses.map((course) => ({ ...course, indexed: true }));

			// Conditionally Refresh UI again, 3rd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = allIndexed;
			}

			savedUntrackedCourses.value[page.currentPage] = allIndexed;
		} catch (err) {
			console.error(err);
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
				const saved = !!savedUntrackedCourses.value[newPageNumber];

				// fetch new page
				if (!saved) searchUntrackedCourse();
			} else if (newPageNumber < oldPageNumber) {
				// replace with old page
				untrackedCourses.value = savedUntrackedCourses.value[newPageNumber] || [];
			}
		},
		{ immediate: false }
	);
</script>
