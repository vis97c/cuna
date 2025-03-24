import { deburr } from "lodash-es";

import type { Course, User } from "~/resources/types/entities";

export function useMapUser({ role = 3, ...user }: User) {
	let roleName = "Invitado";

	role = role ?? 3;

	if (role < 0) roleName = "Desarrollador";
	else if (role < 1) roleName = "Administrador";
	else if (role < 2) roleName = "Editor";
	else if (role < 3) roleName = "Moderador";

	return { ...user, role: roleName };
}

export function useMapCourse({ groups = [], ...course }: Course): Course {
	const SESSION = useSessionStore();
	const [, placeOnly] = deburr(SESSION.place).toLowerCase().replace(" de la", "").split("sede ");

	if (!Array.isArray(groups)) groups = [];

	const thisPlace = groups.some(({ name = "" }) => {
		const lowerName = deburr(name).toLowerCase();

		return lowerName.includes(placeOnly);
	});
	const withPlaces = groups.some(({ name = "" }) => {
		const lowerName = deburr(name).toLowerCase();

		return lowerName.includes("sede");
	});
	const filteredGroups = groups.filter(({ name }) => {
		const lowerName = deburr(name).toLowerCase();

		if (
			!SESSION.withNonRegular &&
			(lowerName.includes("peama") || lowerName.includes("paes"))
		) {
			return false;
		} else if (thisPlace) {
			return lowerName.includes(placeOnly);
		} else if (withPlaces) {
			return lowerName.includes("otras sedes");
		}

		return true;
	});

	return { ...course, groups: filteredGroups, spotsCount: useCountSpots(filteredGroups) };
}
