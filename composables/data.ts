import type { SIACourse, SIAGroup, uSIAProgram } from "~/functions/src/types/SIA";
import type { Course, Group, User } from "~/resources/types/entities";

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
	const programs = <uSIAProgram[]>(
		source.PLANES_ASOCIADOS.split("*** Plan:").map(String.prototype.trim)
	);

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
		teacher: source.DOCENTE,
		activity: source.ACTIVIDAD,
		programs,
		availableSpots: source.CUPOS_DISPONIBLES,
		classroom: source.AULA,
		period: source.PERIODO,
	};
}

export function useMapCourseFromSia(source: SIACourse): Course {
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
		groups: source.DETALLECURSOASIGNATURA.map(useMapGroupFromSia),
	};
}
