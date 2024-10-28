<template>
	<XamuLoaderContent
		:content="!!untrackedCourses?.length || !untrackedCurrentPage"
		:loading="loading"
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
			<div v-else class="flx --flxRow-wrap --flx-start --width-100 --gap-5">
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
					<p class="--maxWidth-220">{{ course.name }}</p>
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
						@click.prevent="searchUntrackedCourse"
					>
						<XamuIconFa name="magnifying-glass" />
						<span>Buscar curso</span>
					</XamuActionButton>
					<template v-else>
						<XamuActionLink @click="() => (untrackedCurrentPage = undefined)">
							<XamuIconFa name="arrow-left" />
							<span>Busqueda</span>
						</XamuActionLink>
						<XamuActionButton :disabled="!untrackedSelected">
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
	import { collection, doc, setDoc } from "firebase/firestore";
	import { debounce } from "lodash-es";
	import type { GroupData } from "~/functions/src/types/entities";

	import type { Course, CourseRef, Teacher, TeacherRef } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";
	import { eSIAScienceProgram, type SIACoursesResponse } from "~/functions/src/types/SIA";
	import { triGram } from "~/resources/utils/firestore";
	import { isNotUndefString } from "~/resources/utils/guards";

	/**
	 * Registing unindexed courses
	 *
	 * @component
	 */

	defineProps<{ close?: () => void }>();

	const APP = useAppStore();
	// const Swal = useSwal();
	const { utils } = useFormInput();
	// const router = useRouter();
	const { $clientFirestore } = useNuxtApp();

	const loading = ref(false);
	const programs: iSelectOption[] = Object.values(eSIAScienceProgram).map((value) => ({ value }));
	const untrackedInvalid = ref<iInvalidInput[]>([]);
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const untrackedCourseInputs = ref(markRaw(useCourseInputs({ programs })));
	const untrackedSelected = ref<number>();
	const untrackedCurrentPage = ref<number>();
	const untrackedCourses = ref<Course[]>();

	const searchUntrackedCourse = debounce(async () => {
		loading.value = true;

		const { values, invalidInputs } = utils.getFormValues<CourseValues>(
			untrackedCourseInputs.value
		);

		if (!invalidInputs.length) {
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
			const courses = await $fetch<iPageEdge<Course, string>[]>("/api/all/users", {
				query: { include: codes },
			});
			const indexedCodes = courses.map(({ node }) => node.code).filter(isNotUndefString);
			const mappedCourses: (Course & { indexed: boolean })[] = dedupedCourses.map(
				(course) => {
					const indexed = !!course.code && indexedCodes.includes(course.code);

					return { ...course, indexed };
				}
			);

			// Refresh UI
			untrackedCourses.value = mappedCourses;

			// a map indexing the courses
			const resolveCoursesRefs = mappedCourses.map(
				async ({ indexed, groups: ogGroups = [], createdAt, updatedAt, ...course }) => {
					// index teachers conditionally
					const groups = await Promise.all(ogGroups.map(indexTeacher));

					// update groups if already indexed
					if (indexed) {
						const coursesCollection = collection($clientFirestore, "courses");
						const existingCourseRef = doc(coursesCollection, course?.code);

						return setDoc(existingCourseRef, { groups }, { merge: true });
					}

					return useDocumentCreate<CourseRef>("courses", {
						...course,
						groups,
						id: course.code,
						indexes: triGram([course.name]),
					});
				}
			);

			// Index courses, do not await
			Promise.all(resolveCoursesRefs);
		} else {
			untrackedInvalid.value = invalidInputs;
		}

		loading.value = false;
	});

	async function indexTeacher({ teacher, ...group }: GroupData = {}): Promise<GroupData> {
		// search for existing teacher
		const [teacherEdge] = await $fetch<[iPageEdge<Teacher, string>?]>("/api/teachers/search", {
			query: { name: teacher },
		});

		if (!teacherEdge?.node.id) {
			// create a new teacher
			await useDocumentCreate<TeacherRef>("teachers", {
				name: teacher,
				indexes: triGram([teacher]),
			});
		}

		return { ...group, teacher };
	}
</script>
