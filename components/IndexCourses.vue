<template>
	<XamuLoaderContent
		:content="!!untrackedCourses?.length || !untrackedCurrentPage"
		:loading="loading"
		:errors="errors"
	>
		<div class="flx --flxColumn --flx-start-stretch --width-100 --gap-30">
			<form
				v-if="!untrackedCourses?.length"
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
			<div v-else class="flx --flxRow-wrap --flx-start --gap-5 --width-100 --maxWidth-480">
				<XamuBaseBox
					v-for="course in untrackedCourses"
					:key="course.code"
					class="txt --txtAlign-left --txtSize-sm --gap-5"
					el="button"
					:active="course.code === untrackedSelected"
					:title="course.name"
					:theme="course.indexed ? eColors.SUCCESS : eColors.SECONDARY"
					button
					@click="() => (untrackedSelected = course.code)"
				>
					<p class="--maxWidth-220 ellipsis">{{ course.name }}</p>
					<p class="--txtSize-xs --txtWeight-regular">
						<b title="Creditos">{{ course.credits }}</b>
						⋅
						<span title="Codigo">{{ course.code }}</span>
						⋅
						<span title="Tipologia">{{ course.typology }}</span>
					</p>
				</XamuBaseBox>
			</div>
			<div class="flx --flxRow --flx-between-center">
				<div class="flx --flxRow --flx-start-center">
					<XamuActionButton
						v-if="!untrackedCourses?.length"
						ref="searchUntrackedRef"
						@click.prevent="searchUntrackedCourse"
					>
						<XamuIconFa name="magnifying-glass" />
						<span>Buscar curso</span>
					</XamuActionButton>
					<template v-else>
						<XamuActionLink @click="reset">
							<XamuIconFa name="arrow-left" />
							<span>Busqueda</span>
						</XamuActionLink>
						<XamuActionButton :disabled="!untrackedSelected" @click="trackCourse">
							Rastrear curso seleccionado
						</XamuActionButton>
					</template>
				</div>
				<XamuActionButtonToggle @click="close">Cerrar</XamuActionButtonToggle>
			</div>
		</div>
	</XamuLoaderContent>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";
	import type { iInvalidInput, iPageEdge, iSelectOption } from "@open-xamu-co/ui-common-types";
	import { debounce } from "lodash-es";
	import type { GroupData } from "~/functions/src/types/entities";

	import type { Course, CourseRef, Teacher, TeacherRef } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { eSIAScienceProgram, type SIACoursesResponse } from "~/functions/src/types/SIA";
	import { triGram } from "~/resources/utils/firestore";
	import { isNotUndefString } from "~/resources/utils/guards";
	import { arrayUnion } from "firebase/firestore";

	/**
	 * Registing unindexed courses
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
	const programs: iSelectOption[] = Object.values(eSIAScienceProgram).map((value) => ({ value }));
	const untrackedInvalid = ref<iInvalidInput[]>([]);
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const untrackedCourseInputs = ref(markRaw(useCourseInputs({ programs })));
	const untrackedSelected = ref<number>();
	const untrackedCurrentPage = ref<SIACoursesResponse>();
	const untrackedCourses = ref<Course[]>();

	const reset = debounce((partial = true) => {
		untrackedSelected.value = undefined;
		untrackedCurrentPage.value = undefined;
		untrackedInvalid.value = [];
		untrackedCourses.value = undefined;

		if (partial) return;

		untrackedCourseInputs.value = useCourseInputs({ programs });
	});

	const trackCourse = debounce(async (course: Course) => {
		SESSION.trackCourse(course);

		// Notify user of the success
		await Swal.fire({
			title: "Curso rastreado",
			text: `Obtendrás actualizaciones del curso ${course.name} periódicamente`,
			icon: "success",
			target: searchUntrackedRef.value,
		});

		// reset
		props.close?.();
		reset(false);
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

			const coursesEndpoint = `${APP.instance?.siaUrl}${APP.instance?.coursesPath}`;
			const coursesPage = await $fetch<SIACoursesResponse>(coursesEndpoint, {
				query: {
					planEstudio: values.program,
					codigo_asignatura: values.code,
					nombre_asignatura: values.name,
					limit: 30, // firebase compound limit
				},
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
			const [indexedCourses, teacherEdges] = await Promise.all([
				$fetch<iPageEdge<Course, string>[]>("/api/all/courses", {
					query: { include: codes },
				}),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: codes },
				}),
			]);

			const teachers = teacherEdges.map(({ node }) => node);
			const indexedCodes = indexedCourses
				.map(({ node }) => node.code)
				.filter(isNotUndefString);
			const mappedCourses: (Course & { indexed: boolean })[] = courses.map((course) => {
				const indexed = !!course.code && indexedCodes.includes(course.code);

				return { ...course, id: `courses/${course?.code}`, indexed };
			});

			// Conditionally Refresh UI again, 2nd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = mappedCourses;
			}

			// a map indexing the courses
			const resolveCoursesRefs = mappedCourses.map(
				async ({ indexed, groups = [], createdAt, updatedAt, ...course }) => {
					// index teachers conditionally
					groups.forEach(({ teacher }: GroupData = {}) => {
						const path = `teachers/${useCyrb53(teacher)}`;
						// search for existing teacher
						const existingTeacher = teachers.find(({ id }) => id === path);
						const teacherCourses = existingTeacher?.courses || [];

						// omit if already included
						if (!course.code || teacherCourses.includes(course.code)) return;

						// creates or updates teacher
						return useDocumentCreate<TeacherRef>("teachers", {
							id: path,
							name: teacher,
							indexes: triGram([teacher]),
							courses: arrayUnion(course.code),
						});
					});

					// update groups if already indexed
					if (indexed) return useDocumentUpdate(course, { groups });

					return useDocumentCreate<CourseRef>("courses", {
						...course,
						groups,
						indexes: triGram([course.name]),
					});
				}
			);

			await Promise.all(resolveCoursesRefs); // Index courses

			// Conditionally Refresh UI again, 3rd time
			if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
				untrackedCourses.value = mappedCourses.map((course) => {
					return { ...course, indexed: true };
				});
			}
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
</script>
