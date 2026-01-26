import type { InstanceLog, Offender } from "@open-xamu-co/firebase-nuxt/client";

import type {
	ExtendedInstance,
	ExtendedInstanceMember,
	ExtendedUser,
	Group,
	GroupEs,
	Proxy,
} from "~/utils/types";
import { eMemberRole } from "~~/functions/src/enums";

export const markdownExample =
	"# Título\n\n" +
	"Esto es un ejemplo de texto.\n\n" +
	"[Enlace](https://cuna.com.co)\n\n" +
	"![Imagen](https://cuna.com.co/images/seo.png)";

export function useRoleName(role = 3) {
	let roleName = "Invitado";

	role = role ?? eMemberRole.GUEST;

	if (role <= eMemberRole.DEVELOPER) roleName = "Desarrollador";
	else if (role <= eMemberRole.ADMIN) roleName = "Administrador";
	else if (role <= eMemberRole.EDITOR) roleName = "Editor";
	else if (role <= eMemberRole.MODERATOR) roleName = "Moderador";

	return roleName;
}

export function useMapUser({
	instances = [],
	isAnonymous,
	createdBy,
	updatedBy,
	...user
}: ExtendedUser) {
	const USER = useUserStore();

	if (createdBy) user.createdBy = useMapMember(createdBy);
	if (updatedBy) user.updatedBy = useMapMember(updatedBy);
	if (USER.canDevelop) user.instances = instances.map(useMapInstance);

	return user;
}

export function useMapMember({
	role,
	user = {},
	rootMember = {},
	...member
}: ExtendedInstanceMember) {
	return { ...useMapUser(user), ...member, role: useRoleName(rootMember.role ?? role ?? 3) };
}

export function useMapInstance({
	createdBy,
	updatedBy,
	ownedBy,
	banner = {},
	...instance
}: ExtendedInstance) {
	if (createdBy) instance.createdBy = useMapMember(createdBy);
	if (updatedBy) instance.updatedBy = useMapMember(updatedBy);
	if (ownedBy) instance.ownedBy = useMapMember(ownedBy);

	return {
		...instance,
		banner: { message: banner.message, url: banner.url },
	};
}

export function useMapOffender({ createdBy, updatedBy, lastLog, ...offender }: Offender) {
	offender.createdBy = createdBy ? useMapMember(createdBy) : undefined;
	offender.updatedBy = updatedBy ? useMapMember(updatedBy) : undefined;

	return { ...offender, lastLog };
}

export function useMapLog({ createdBy, updatedBy, metadata, ...log }: InstanceLog) {
	log.createdBy = createdBy ? useMapMember(createdBy) : undefined;
	log.updatedBy = updatedBy ? useMapMember(updatedBy) : undefined;

	return { ...log, metadata };
}

export function useMapGroupEs(group: Group): GroupEs {
	const { name, availableSpots, spots, classrooms, teachers } = group;
	const endDate = new Date(group.periodEndAt || "");
	/**
	 * Semestre activo
	 * 2 semestres por año
	 *
	 * @example 2026-1
	 */
	const semestre = `${endDate.getFullYear()}-${endDate.getMonth() < 6 ? 1 : 2}`;

	return {
		id: `${name}`, // hotfix to prevent it to parse as date
		cupos: `${availableSpots} de ${spots}`,
		espacios: classrooms?.filter((c) => !!c),
		profesores: teachers,
		horarios: group,
		inscrito: group,
		semestre,
	};
}

/**
 * Map proxy
 * Active definition based on makeGetProxies definitions
 */
export function useMapProxy({
	proxy,
	disabled,
	score = 1,
	timeout = 1,
	timesDead = 1,
	timesAlive = 1,
	sessionTimeout = 1,
}: Proxy) {
	// Not ignored by query
	const queryOk = score <= 2 && timeout <= 30;
	// Percentage of times dead
	const threshold = timesDead > timesAlive * 0.9;
	const active = !disabled && queryOk && !threshold;

	return {
		proxy,
		score: score.toFixed(2),
		deaths: timesDead,
		lives: timesAlive,
		mortality: `${((timesDead / timesAlive) * 100).toFixed(2)}%`,
		avgTimeout: timeout.toFixed(2),
		avgSession: sessionTimeout.toFixed(2),
		active,
		disabled,
	};
}
