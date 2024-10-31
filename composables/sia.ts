import { arrayUnion } from "firebase/firestore";
import type { GroupData } from "~/functions/src/types/entities";
import type { SIACoursesResponse } from "~/functions/src/types/SIA";
import type { Course, CourseRef, Teacher, TeacherRef } from "~/resources/types/entities";
import type { CourseValues } from "~/resources/types/values";
import { triGram } from "~/resources/utils/firestore";

export function useSIACourses(values: CourseValues, page = 1) {
	const APP = useAppStore();
	const { siaCoursesURL = "", siaCoursesPath = "" } = APP.instance?.config || {};
	const coursesEndpoint = `${siaCoursesURL}${siaCoursesPath}`;

	return $fetch<SIACoursesResponse>(coursesEndpoint, {
		query: {
			planEstudio: values.program || undefined,
			codigo_asignatura: values.code || undefined,
			nombre_asignatura: values.name || undefined,
			tipologia: values.typology || undefined,
			limit: 30, // firebase compound limit
			page,
		},
		cache: "no-cache",
	});
}

export async function useIndexCourse({
	indexed,
	indexedTeachers = [],
	groups = [],
	createdAt,
	updatedAt,
	...course
}: Course & { indexed?: boolean; indexedTeachers?: Teacher[] }) {
	const APP = useAppStore();

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
			// TODO: index teacher on server side
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
	// TODO: index course on server side
	return useDocumentCreate<CourseRef>("courses", {
		...course,
		indexes: triGram([course.name]),
		groups,
	});
}

export function useCountSpots({ groups, spotsCount }: Partial<Course> = {}): number {
	const withReduce = groups?.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return (withReduce || spotsCount) ?? 0;
}
