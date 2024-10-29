import type { SIACourse, SIAGroup, uSIAProgram } from "~/functions/src/types/SIA";
import type { Course, Group, User } from "~/resources/types/entities";
import { isNotUndefString } from "~/resources/utils/guards";

export function useImagePath(
	path?: string,
	preset: "avatar" | "small" | "medium" | "large" = "avatar"
) {
	if (!path) return "/sample.png";

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
	const programs = <uSIAProgram[]>source.PLANES_ASOCIADOS.split("*** Plan:")
		.map((p) => p.trim())
		.filter((p) => !!p);

	return {
		SIA: source.ID,
		name: source.GRUPO,
		spots: source.CUPOS,
		schedule: [
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
			source.HORARIO_LUNES,
		],
		teachers: [source.DOCENTE],
		activity: source.ACTIVIDAD,
		programs,
		availableSpots: source.CUPOS_DISPONIBLES,
		classrooms: [source.AULA],
		period: source.PERIODO,
	};
}

export function useMapCourseFromSia(source: SIACourse): Course {
	const groups: Group[] = [];

	// Dedupe groups
	source.DETALLECURSOASIGNATURA.map(useMapGroupFromSia).forEach((group) => {
		// Groups can be duplicated diff(teacher, schedule, classroom)
		const groupIndex = groups.findIndex(({ name }) => name === group.name);

		if (groupIndex < 0) return groups.push(group); // Index group

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
		SIA: source.IDBUSCADORCURSO,
		name: source.NOMBREASIGNATURA,
		code: source.CODIGO_ASIGNATURA,
		credits: source.NUM_CREDITOS,
		typology: source.TIPOLOGIA,
		level: source.NIVELDEESTUDIO,
		place: source.SEDE,
		faculty: source.FACULTAD,
		program: source.PLANDEESTUDIO,
		groups,
		spotsCount,
	};
}
