import type { Course } from "~/resources/types/entities";
import {
	eSIATypology,
	type CoursesResponse,
	type uSIAFaculty,
	type uSIAProgram,
} from "~/functions/src/types/SIA";
import type { CourseValues } from "~/resources/types/values";
import {
	eExplorerV2Faculties,
	type ExplorerV2Faculty,
	eExplorerV2Level,
	type ExplorerV2Program,
	type ExplorerV2Course,
	eExploreV2ToTypology,
	eExploreV2ToPlace,
	eExploreV2ToLevel,
} from "~/functions/src/types/SIA/explorerV2";
import { Cyrb53 } from "~/resources/utils/firestore";
import { capitalize, deburr } from "lodash-es";

function useMapCourseFromExplorerV2(course: ExplorerV2Course): Course {
	// Generate deduped course UID
	const id = `courses/${Cyrb53([course.cod_asignatura])}`;
	const level = eExploreV2ToLevel[course.nivel];
	const place = eExploreV2ToPlace[course.sede];
	let faculty: uSIAFaculty | undefined;
	let program: uSIAProgram | undefined;
	const typology = eExploreV2ToTypology[course.tipologia];

	if (!level || !place) {
		console.log(course, level, place);

		throw new Error("Could not find level or place");
	}

	for (const facultyData of UNAL[place]) {
		const { programs } = facultyData;
		const match = programs.find((x) => x.split(" ")[0] === course.cod_plan);

		if (match) {
			faculty = facultyData.faculty;
			program = match;
			break;
		}
	}

	if (!faculty || !program) throw new Error("Could not find faculty or program");

	return {
		id,
		ExplorerV2Id: course.id_asignatura,
		name: capitalize(course.asignatura),
		alternativeNames: [course.asignatura],
		level,
		place,
		faculty,
		faculties: [faculty],
		program,
		programs: [program],
		code: course.cod_asignatura,
		credits: course.credits,
		typology,
		typologies: [typology],
	};
}

/**
 * Explorer V2 courses
 *
 * Unpaginated response
 */
export async function useExplorerV2Courses(values: CourseValues): Promise<CoursesResponse<Course>> {
	const APP = useAppStore();
	const endpoint = APP.config?.explorerV2CoursesURL;
	let courses: ExplorerV2Course[] = [];

	if (!endpoint) throw new Error("Missing Explorer V2 courses URL");

	if (values.code) {
		const coursesEndpoint = `${endpoint}/finder/search?st=${values.code}`;

		courses = await useFetchQuery<ExplorerV2Course[]>(coursesEndpoint);
	} else {
		if (!values.level || !values.place || !values.faculty || !values.program) {
			throw new Error("Missing level, place, faculty or program");
		}

		// Get faculties
		const facultiesEndpoint = `${endpoint}/finder/faculty/division/${eExplorerV2Faculties[values.place]}`;
		const faculties = await useFetchQuery<ExplorerV2Faculty[]>(facultiesEndpoint);
		const facultyCode = values.faculty.split(" ")[0];
		const facultyData = faculties.find(({ code }) => code === facultyCode);

		if (!facultyData) throw new Error("Could not find faculty");

		// Get programs
		const programsEndpoint = `${endpoint}/finder/plan/faculty/${facultyData.id_faculty}/level/${eExplorerV2Level[values.level]}`;
		const programs = await useFetchQuery<ExplorerV2Program[]>(programsEndpoint);
		const programCode = values.program?.split(" ")[0];
		const programData = programs.find(({ code_plan }) => code_plan === programCode);

		if (!programData) throw new Error("Could not find program");

		const coursesEndpoint = `${endpoint}/finder/search/plan/${programData.code_plan}`;

		// Get courses
		courses = await useFetchQuery<ExplorerV2Course[]>(coursesEndpoint);
	}

	const codes: string[] = [];
	const dedupedCourses: Course[] = [];
	const flatSearchName = deburr(values.name).toLowerCase();

	/**
	 * Remove duplicates & omit courses without groups
	 * The system return entities with the same data but differing in the internal id
	 */
	courses.forEach((ExploreV2Course) => {
		const { faculties = [], name, ...course } = useMapCourseFromExplorerV2(ExploreV2Course);
		const flatName = deburr(name).toLowerCase();

		if (!course.code || (flatSearchName && !flatName.includes(flatSearchName))) return;

		const dedupedCourseIndex = dedupedCourses.findIndex(({ id }) => id === course.id);

		if (dedupedCourseIndex >= 0) {
			// merge details
			const dedupedCourse = dedupedCourses[dedupedCourseIndex];
			const uniquePrograms = [
				...new Set([dedupedCourse.programs, course.programs].flat()),
			].filter((p: uSIAProgram | undefined): p is uSIAProgram => !!p);
			const uniqueTypologies = [
				...new Set([dedupedCourse.typologies, course.typologies].flat()),
			].filter((p: eSIATypology | undefined): p is eSIATypology => !!p);

			dedupedCourses[dedupedCourseIndex].programs = uniquePrograms;
			dedupedCourses[dedupedCourseIndex].typologies = uniqueTypologies;

			return;
		}

		// Inject faculty, that helped in search
		if (values.faculty && !faculties.includes(values.faculty)) {
			faculties.push(values.faculty);
		}

		codes.push(course.code);
		dedupedCourses.push({ ...course, name, faculties });
	});

	const totalRecords = dedupedCourses.length;

	return {
		data: dedupedCourses,
		totalRecords,
		totalPages: 1,
		currentPage: 1,
		limit: totalRecords,
	};
}
