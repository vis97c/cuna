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
							<XamuIconFa name="arrow-left" />
							<XamuIconFa name="arrow-left" />
							<span>Anterior</span>
						</XamuActionButtonToggle>
						<XamuActionButtonToggle
							:disabled="
								untrackedCurrentPage.currentPage >= untrackedCurrentPage.totalPages
							"
							@click="untrackedCurrentPage.currentPage++"
						>
							<span>Siguiente página</span>
							<XamuIconFa name="arrow-right" />
							<XamuIconFa name="arrow-right" />
						</XamuActionButtonToggle>
					</div>
					<div class="flx --flxRow-wrap --flx-start --gap-5 --width-100">
						<XamuBaseBox
							v-for="course in untrackedCourses"
							:key="course.code"
							class="txt --txtAlign-left --txtSize-sm --gap-5"
							el="button"
							:active="course.code === untrackedSelected?.code"
							:title="course.name"
							:theme="course.indexed ? eColors.SUCCESS : eColors.SECONDARY"
							button
							@click="() => (untrackedSelected = course)"
						>
							<p class="--maxWidth-220 ellipsis">{{ course.name }}</p>
							<div class="txt --txtSize-xs --txtWeight-regular --gap-0">
								<p>
									<b title="Creditos">{{ course.credits || 0 }}</b>
									⋅
									<span title="Codigo">{{ course.code }}</span>
									⋅
									<span title="Tipologia">{{ course.typology }}</span>
								</p>
								<p>
									<b title="Cupos disponibles">
										{{ course.spotsCount || 0 }} cupos disponibles
									</b>
								</p>
							</div>
						</XamuBaseBox>
					</div>
				</template>
				<div v-else class="">
					<XamuBoxMessage
						v-if="untrackedCurrentPage"
						text="Definitivamente no hay cursos de la UNAL que coincidan con tu busqueda."
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
						<XamuIconFa name="arrow-left" />
						<span>Buscar otro</span>
					</XamuActionLink>
					<XamuActionButton :disabled="!untrackedSelected" @click="trackCourse">
						Rastrear curso seleccionado
					</XamuActionButton>
				</template>
			</div>
			<XamuActionButtonToggle @click="close">Cerrar</XamuActionButtonToggle>
		</div>
	</XamuLoaderContent>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";
	import type { iInvalidInput, iPageEdge } from "@open-xamu-co/ui-common-types";
	import { debounce } from "lodash-es";

	import type { GroupData } from "~/functions/src/types/entities";
	import type { Course, CourseRef, Teacher, TeacherRef } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { type SIACoursesResponse } from "~/functions/src/types/SIA";
	import { triGram } from "~/resources/utils/firestore";
	import { isNotUndefString } from "~/resources/utils/guards";
	import { arrayUnion } from "firebase/firestore";

	/**
	 * Registering unindexed courses
	 *
	 * @component
	 */

	const props = defineProps<{ close?: () => void }>();

	const APP = useAppStore();
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
	const untrackedSelected = ref<Course>();
	const untrackedCurrentPage = ref<SIACoursesResponse>();
	const untrackedCourses = ref<Course[]>();
	const savedUntrackedCourses = ref<Record<number, Course[]>>({});

	const reset = debounce((partial = true) => {
		untrackedSelected.value = undefined;
		untrackedCurrentPage.value = undefined;
		untrackedInvalid.value = [];
		untrackedCourses.value = undefined;
		savedUntrackedCourses.value = {};

		if (partial) return;

		untrackedCourseInputs.value = useCourseInputs();
	});

	function closeAndReset() {
		props.close?.();
		reset(false);
	}

	const trackCourse = debounce(async () => {
		if (!untrackedSelected.value) return;

		SESSION.trackCourse(untrackedSelected.value);

		// Notify user of the success
		await Swal.fire({
			title: "Curso rastreado",
			text: `Obtendrás actualizaciones del curso ${untrackedSelected.value.name} periódicamente`,
			icon: "success",
			target: searchUntrackedRef.value,
		});

		// reset
		closeAndReset();
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

			const { siaCoursesURL = "", siaCoursesPath = "" } = APP.instance?.config || {};
			const coursesEndpoint = `${siaCoursesURL}${siaCoursesPath}`;
			const coursesPage = await $fetch<SIACoursesResponse>(coursesEndpoint, {
				query: {
					planEstudio: values.program,
					codigo_asignatura: values.code,
					nombre_asignatura: values.name,
					tipologia: values.typology,
					limit: 30, // firebase compound limit
					page: untrackedCurrentPage.value?.currentPage || 1,
				},
				cache: "no-cache",
			});
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
			const codes = courses.map(({ code }) => code).filter(isNotUndefString);

			// Get firebase data, do not await
			const [indexedCoursesEdges, indexedTeacherEdges = []] = await Promise.all([
				$fetch<iPageEdge<Course, string>[]>("/api/all/courses", {
					query: { include: codes },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: codes },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
			]);

			const indexedTeachers = indexedTeacherEdges.map(({ node }) => node);
			const indexedCourses = indexedCoursesEdges.map(({ node }) => node);
			const mappedCourses: (Course & { indexed: boolean })[] = courses.map((course) => {
				// With typology to prevent false matches
				const id = `courses/${useCyrb53([course?.code, course?.typology])}`;
				const indexedCourse = indexedCourses.find((c) => c.id === id);

				return {
					...course,
					id,
					indexed: !!indexedCourse,
					updatedAt: indexedCourse?.updatedAt,
				};
			});

			// Conditionally Refresh UI again, 2nd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = mappedCourses;
			}

			savedUntrackedCourses.value[page.currentPage] = mappedCourses;

			// a map indexing the courses
			const resolveCoursesRefs = mappedCourses.map(
				async ({ indexed, groups = [], createdAt, updatedAt, ...course }) => {
					// index teachers conditionally
					groups.forEach((group: GroupData = {}) => {
						(group.teachers || []).forEach((teacher) => {
							const id = `teachers/${useCyrb53([teacher])}`;
							// search for existing teacher
							const existingTeacher = indexedTeachers.find((t) => t.id === id);
							const teacherCourses = existingTeacher?.courses || [];

							// omit if already included
							if (!course.code || teacherCourses.includes(course.code)) return;

							// creates or updates teacher
							return useDocumentCreate<TeacherRef>("teachers", {
								id,
								name: teacher,
								indexes: triGram([teacher]),
								courses: arrayUnion(course.code),
							});
						});
					});

					const updatedAtMilis = new Date(updatedAt || "").getTime();
					const nowMilis = new Date().getTime();
					const millisDiff = nowMilis - updatedAtMilis;
					const minutes = APP.instance?.config?.coursesRefreshRate || 5;

					// Do not update if updated less than threshold
					if (indexed && millisDiff <= minutes * 60 * 1000) return;

					// creates or updates course
					return useDocumentCreate<CourseRef>("courses", {
						...course,
						indexes: triGram([course.name]),
						groups,
					});
				}
			);

			// Index courses
			await Promise.all(resolveCoursesRefs);

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
