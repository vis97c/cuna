import { arrayUnion } from "firebase/firestore";

import type { Course, CourseRef } from "~/resources/types/entities";
import { triGram } from "~/resources/utils/firestore";

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

	// Ensure arrays
	if (indexedCourse) {
		if (!Array.isArray(indexedCourse?.typologies)) indexedCourse.typologies = [];
		if (!Array.isArray(indexedCourse?.faculties)) indexedCourse.faculties = [];
		if (!Array.isArray(indexedCourse?.programs)) indexedCourse.programs = [];
		if (!Array.isArray(indexedCourse?.alternativeNames)) indexedCourse.alternativeNames = [];
	}

	// Prevent update if same data
	if (
		indexedCourse?.credits === course.credits &&
		indexedCourse?.programs?.every((p) => programs.includes(p)) &&
		indexedCourse?.typologies?.every((t) => typologies.includes(t)) &&
		indexedCourse?.alternativeNames?.every((p) => alternativeNames.includes(p))
	) {
		return;
	}

	const minutes = APP.config?.coursesRefreshRate || 5;
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
