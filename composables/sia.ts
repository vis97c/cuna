import { arrayUnion } from "firebase/firestore";

import type { SIACoursesResponse } from "~/functions/src/types/SIA";
import type { Course, CourseRef } from "~/resources/types/entities";
import type { CourseValues } from "~/resources/types/values";
import { triGram } from "~/resources/utils/firestore";

export function useSIACourses(values: CourseValues, page = 1) {
	const APP = useAppStore();
	const { siaCoursesURL = "", siaCoursesPath = "" } = APP.instance?.config || {};
	const coursesEndpoint = `${siaCoursesURL}${siaCoursesPath}`;

	return useFetchQuery<SIACoursesResponse>(coursesEndpoint, {
		nivel: values.level,
		sede: values.place,
		planEstudio: values.program || undefined,
		codigo_asignatura: values.code || undefined,
		nombre_asignatura: values.name || undefined,
		tipologia: values.typology || undefined,
		limit: 30, // firebase compound limit
		page,
	});
}

export async function useIndexCourse(
	{
		indexed,
		faculties = [],
		programs = [],
		typologies = [],
		alternativeNames = [],
		createdAt,
		updatedAt,
		scrapedAt,
		...course
	}: Course,
	indexedCourse?: Course
) {
	const APP = useAppStore();
	const courseToIndex: CourseRef = {
		...course,
		faculties: arrayUnion(...faculties),
		programs: arrayUnion(...programs),
		typologies: arrayUnion(...typologies),
		alternativeNames: arrayUnion(...alternativeNames),
		indexes: triGram([course.name]),
	};

	// Prevent update if same data
	if (
		indexedCourse?.credits === course.credits &&
		indexedCourse?.programs?.every((p) => programs.includes(p)) &&
		indexedCourse?.typologies?.every((t) => typologies.includes(t)) &&
		indexedCourse?.alternativeNames?.every((p) => alternativeNames.includes(p))
	) {
		return;
	}

	const minutes = APP.instance?.config?.coursesRefreshRate || 5;
	const nowMilis = new Date().getTime();
	const updatedAtMilis = new Date(updatedAt || "").getTime();
	const updatedDiffMilis = nowMilis - updatedAtMilis;

	// Do not update if updated less than threshold
	if (updatedDiffMilis <= useMinMilis(minutes)) return;

	// Do not override SIA scraping
	if (indexedCourse?.scrapedAt) {
		delete courseToIndex.groups;
		delete courseToIndex.groupCount;
		delete courseToIndex.spotsCount;
	}

	// creates or updates course
	return useDocumentCreate<CourseRef>("courses", courseToIndex);
}
