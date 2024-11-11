import { capitalize, deburr, startCase } from "lodash-es";

import type { SIACourse, SIAGroup } from "~/functions/src/types/SIA";
import type { Course, Group, User } from "~/resources/types/entities";
import { isNotUndefString } from "~/resources/utils/guards";

export function useImagePath(
	path?: string,
	preset: "avatar" | "small" | "medium" | "large" = "avatar"
) {
	if (!path) return "/images/sample.png";

	return `/api/media/images/${path}/${preset}.webp`;
}

export function useMapUser({ role = 3, ...user }: User) {
	let roleName = "Invitado";

	role = role ?? 3;

	if (role < 0) roleName = "Desarrollador";
	else if (role < 1) roleName = "Administrador";
	else if (role < 2) roleName = "Editor";
	else if (role < 3) roleName = "Moderador";

	return { ...user, role: roleName };
}

export function useMapGroupFromSia(source: SIAGroup): Group {
	return {
		SIA: source.ID,
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
	};
}

export function useMapCourseFromSia(source: SIACourse): Course {
	const id = `courses/${useCyrb53([source.CODIGO_ASIGNATURA])}`;
	const groups: Group[] = [];

	// Dedupe groups
	source.DETALLECURSOASIGNATURA.map(useMapGroupFromSia).forEach((group) => {
		// Groups can be duplicated diff(teacher, schedule, classroom)
		const groupIndex = groups.findIndex(({ name }) => name === group.name);

		if (groupIndex === -1) return groups.push(group); // Index group

		const currentSchedule = groups[groupIndex].schedule || [];
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
		SIA: source.IDBUSCADORCURSO,
		name: capitalize(source.NOMBREASIGNATURA),
		alternativeNames: [source.NOMBREASIGNATURA],
		code: source.CODIGO_ASIGNATURA,
		credits: source.NUM_CREDITOS,
		typologies: [source.TIPOLOGIA],
		level: source.NIVELDEESTUDIO,
		place: source.SEDE,
		faculty: source.FACULTAD,
		programs: source.PLANDEESTUDIO ? [source.PLANDEESTUDIO] : [],
		groups,
		spotsCount,
	};
}

export function useMapCourse({ groups = [], ...course }: Course): Course {
	const SESSION = useSessionStore();
	const lowerPlace = deburr(course.place).toLowerCase();
	const otherPlaces = groups.some(({ name = "" }) => {
		const lowerName = deburr(name).toLowerCase();

		return lowerName.includes("otras sedes");
	});

	const filteredGroups = groups.filter(({ name }) => {
		const lowerName = deburr(name).toLowerCase();

		if (
			!SESSION.withNonRegular &&
			(lowerName.includes("peama") || lowerName.includes("paes"))
		) {
			return false;
		} else if (otherPlaces) {
			return lowerName.includes(lowerPlace);
		}

		return true;
	});

	return { ...course, groups: filteredGroups, spotsCount: useCountSpots(filteredGroups) };
}
