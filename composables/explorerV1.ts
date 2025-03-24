import { startCase, capitalize } from "lodash-es";

import type { Group, Course } from "~/resources/types/entities";
import {
	type ExplorerV1Group,
	type uSIAProgram,
	type ExplorerV1Course,
	eSIATypology,
	type CoursesResponse,
	type ExplorerV1CoursesPayload,
	type ExplorerV1CoursesResponse,
} from "~/functions/src/types/SIA";
import { Cyrb53 } from "~/resources/utils/firestore";
import { isNotUndefString } from "~/resources/utils/guards";
import type { CourseValues } from "~/resources/types/values";

export function useMapGroupFromExplorerV1(source: ExplorerV1Group): Group {
	const programsString = source.PLANES_ASOCIADOS || "";
	const [, ...programs] = programsString.split("*** Plan:").map((p) => <uSIAProgram>p.trim());

	return {
		ExplorerV1Id: source.ID,
		name: source.GRUPO,
		spots: source.CUPOS,
		schedule: [
			source.HORARIO_LUNES,
			source.HORARIO_MARTES,
			source.HORARIO_MIERCOLES,
			source.HORARIO_JUEVES,
			source.HORARIO_VIERNES,
			source.HORARIO_SABADO,
			source.HORARIO_DOMINGO,
		],
		teachers: [startCase(source.DOCENTE.toLowerCase())],
		activity: source.ACTIVIDAD,
		availableSpots: source.CUPOS_DISPONIBLES,
		classrooms: [source.AULA],
		period: source.PERIODO,
		programs,
	};
}

/**
 * Map course from SIA beta
 */
export function useMapCourseFromExplorerV1(source: ExplorerV1Course): Course {
	// Generate deduped course UID
	const id = `courses/${Cyrb53([source.CODIGO_ASIGNATURA])}`;
	const groups: Group[] = [];
	const typology = source.TIPOLOGIA;
	const place = source.SEDE;
	let faculty = source.FACULTAD;
	let faculties = [faculty];
	let programs = source.PLANDEESTUDIO ? [source.PLANDEESTUDIO] : [];

	// Dedupe groups
	source.DETALLECURSOASIGNATURA.forEach((groupBETA) => {
		const group = useMapGroupFromExplorerV1(groupBETA);
		// Groups can be duplicated diff(teacher, schedule, classroom)
		const groupIndex = groups.findIndex(({ name }) => name === group.name);

		// Index group
		if (groupIndex === -1) {
			// Assign one of the associated programs
			// Some global LE programs do not have an associated program and are hard to find on old SIA
			if (!programs.length && typology === eSIATypology.LIBRE_ELECCIÓN) {
				const [program] = group.programs || [];
				const associatedFaculty = UNAL[place].find((f) => f.programs.includes(program));

				if (!associatedFaculty) return groups.push(group);

				faculty = associatedFaculty.faculty;
				faculties = [faculty];
				programs = [program];
			}

			return groups.push(group);
		}

		const currentSchedule = groups[groupIndex]?.schedule || [];
		const newSchedule = group.schedule || [];
		const uniqueClassrooms = [
			...new Set([groups[groupIndex].classrooms, group.classrooms].flat()),
		].filter(isNotUndefString);
		const uniqueTeachers = [
			...new Set([groups[groupIndex].teachers, group.teachers].flat()),
		].filter(isNotUndefString);

		// Complement existing group data
		groups[groupIndex].classrooms = uniqueClassrooms;
		groups[groupIndex].teachers = uniqueTeachers;
		groups[groupIndex].schedule = [
			currentSchedule[0] || newSchedule[0], // monday
			currentSchedule[1] || newSchedule[1], // tuesday
			currentSchedule[2] || newSchedule[2], // wednesday
			currentSchedule[3] || newSchedule[3], // thursday
			currentSchedule[4] || newSchedule[4], // friday
			currentSchedule[5] || newSchedule[5], // saturday
			currentSchedule[6] || newSchedule[6], // sunday
		];
	});

	const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return {
		id,
		ExplorerV1Id: source.IDBUSCADORCURSO,
		name: capitalize(source.NOMBREASIGNATURA),
		alternativeNames: [source.NOMBREASIGNATURA],
		code: source.CODIGO_ASIGNATURA,
		credits: source.NUM_CREDITOS,
		typologies: [typology],
		level: source.NIVELDEESTUDIO,
		place,
		faculty,
		faculties,
		programs,
		groups,
		spotsCount,
	};
}

/**
 * Explorer V1 courses
 *
 * Paginated response
 *
 * @deprecated 23/03/2025, Use useExplorerV2Courses instead
 */
export async function useExplorerV1Courses(
	values: CourseValues,
	page = 1
): Promise<CoursesResponse<Course>> {
	const APP = useAppStore();
	const { explorerV1CoursesURL = "", explorerV1CoursesPath = "" } = APP.config || {};
	const coursesEndpoint = `${explorerV1CoursesURL}${explorerV1CoursesPath}`;
	const payload: ExplorerV1CoursesPayload = {
		nivel: values.level,
		sede: values.place,
		planEstudio: values.program || undefined,
		codigo_asignatura: values.code || undefined,
		nombre_asignatura: values.name || undefined,
		tipologia: values.typology || undefined,
		limit: 30, // firebase compound limit
		page,
	};

	const response = await useFetchQuery<ExplorerV1CoursesResponse>(coursesEndpoint, payload);
	const codes: string[] = [];
	const dedupedCourses: Course[] = [];

	/**
	 * Remove duplicates & omit courses without groups
	 * The system return entities with the same data but differing in the internal id
	 */
	response.data.forEach((ExploreV1Course) => {
		const { faculties = [], ...course } = useMapCourseFromExplorerV1(ExploreV1Course);

		if (!course.code || !course.groups?.length) return;

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
		dedupedCourses.push({ ...course, faculties });
	});

	return { ...response, data: dedupedCourses };
}
