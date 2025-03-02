import { arrayUnion, Timestamp } from "firebase/firestore";
import { startCase, deburr } from "lodash-es";
import type { GroupData } from "~/functions/src/types/entities";
import type { SIACoursesResponse } from "~/functions/src/types/SIA";
import type { Course, CourseRef, TeacherRef } from "~/resources/types/entities";
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
		groups = [],
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
		programs: arrayUnion(...programs),
		typologies: arrayUnion(...typologies),
		alternativeNames: arrayUnion(...alternativeNames),
		indexes: triGram([course.name]),
	};
	const minutes = APP.instance?.config?.coursesRefreshRate || 5;
	const nowMilis = new Date().getTime();
	const updatedAtMilis = new Date(updatedAt || "").getTime();
	const updatedDiffMilis = nowMilis - updatedAtMilis;

	// Same programs & typologies
	if (
		indexedCourse?.programs?.every((p) => programs.includes(p)) &&
		indexedCourse?.typologies?.every((t) => typologies.includes(t)) &&
		indexedCourse?.alternativeNames?.every((p) => alternativeNames.includes(p))
	) {
		// Do not update if updated less than threshold
		if (updatedDiffMilis <= useMinMilis(minutes)) return;
	}

	// Index teachers
	groups.forEach((group: GroupData = {}) => {
		(group.teachers || []).forEach((teacher) => {
			// Generate deduped teacher UID
			const id = `teachers/${useCyrb53([deburr(teacher)])}`;

			// creates or updates teacher
			useDocumentCreate<TeacherRef>("teachers", {
				id,
				name: startCase(teacher.toLowerCase()),
				indexes: triGram([teacher]),
				courses: arrayUnion(course.code),
			});
		});
	});

	const scrapedAtMilis = new Date(indexedCourse?.scrapedAt || "").getTime();
	const scrapedDiffMilis = nowMilis - scrapedAtMilis;

	// Do not override SIA scraping, unless too old
	if (
		scrapedAt ||
		scrapedDiffMilis > useMinMilis(minutes * 2) ||
		!indexedCourse?.groups?.length
	) {
		courseToIndex.groups = groups;

		if (scrapedAt && typeof scrapedAt !== "string") {
			courseToIndex.scrapedAt = Timestamp.fromDate(scrapedAt);
		}
	}

	// creates or updates course
	return useDocumentCreate<CourseRef>("courses", courseToIndex);
}
