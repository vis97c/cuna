import type { Instance, Member, Group, GroupEs, Proxy, MemberAbuse } from "~/utils/types.ts";
import type { OutputFromData } from "~/utils/types/entities/base.ts";
import type { Log, Offender } from "~/utils/types/entities/log.ts";
import { eMemberRole, type AuditData } from "~~/functions/src/types/entities/index.ts";
import type { SearchData } from "~~/functions/src/types/entities/base.ts";

export const markdownExample =
	"# Título\n\n" +
	"Esto es un ejemplo de texto.\n\n" +
	"[Enlace](https://cuna.com.co)\n\n" +
	"![Imagen](https://cuna.com.co/images/seo.png)";

export function useImagePath(
	path?: string,
	preset: "avatar" | "small" | "medium" | "large" = "avatar"
) {
	if (!path || path === "/sample-loading.png") return "/sample-loading.png";
	else if (path.startsWith("/api/media/images")) return path;
	else if (path.startsWith("/firebase")) path = path.replace("/firebase", "/api/media/images");
	else path = `/api/media/images/${path}/${preset}.webp`;

	return `${path}?temp=${Date.now()}`;
}

export function useRoleName(role = 3) {
	let roleName = "Invitado";

	role = role ?? eMemberRole.GUEST;

	if (role <= eMemberRole.DEVELOPER) roleName = "Desarrollador";
	else if (role <= eMemberRole.ADMIN) roleName = "Administrador";
	else if (role <= eMemberRole.EDITOR) roleName = "Editor";
	else if (role <= eMemberRole.MODERATOR) roleName = "Moderador";

	return roleName;
}

function useMapAudit({
	createdBy,
	updatedBy,
	deletedBy,
	lock,
	...data
}: OutputFromData<AuditData>) {
	if (createdBy) data.createdBy = useMapMember(createdBy);
	if (updatedBy) data.updatedBy = useMapMember(updatedBy);
	if (deletedBy) data.deletedBy = useMapMember(deletedBy);

	return data;
}

/**
 * Clean search data from searcheable entities
 */
function useMapSearch({ indexes, indexesWeights, ...searchData }: OutputFromData<SearchData>) {
	return useMapAudit(searchData);
}

export function useMapMember({
	address,
	bannedUntilAt,
	cellphoneIndicative,
	cellphoneNumber,
	description,
	documentNumber,
	documentType,
	emailVerified,
	isAnonymous,
	level,
	locationCity,
	locationCountry,
	locationState,
	zip,
	...member
}: Member) {
	const SESSION = useSessionStore();

	if (!SESSION.canModerate) delete member.role;

	return useMapSearch(member);
}

export function useMapMemberAbuse({ commitedBy, ...memberAbuse }: MemberAbuse) {
	return useMapAudit({
		...memberAbuse,
		commitedBy: commitedBy ? useMapMember(commitedBy) : undefined,
	});
}

export function useMapInstance({ ownedBy, banner = {}, ...instance }: Instance) {
	return useMapAudit({
		...instance,
		ownedBy: ownedBy ? useMapMember(ownedBy) : undefined,
		banner: { message: banner.message, url: banner.url },
	});
}

export function useMapOffender({ lastLog, ...offender }: Offender) {
	return useMapAudit({ ...offender, lastLog: lastLog ? useMapLog(lastLog) : undefined });
}

export function useMapLog({ metadata, ...log }: Log) {
	return useMapAudit({ ...log, metadata });
}

export function useMapGroupEs(group: Group): GroupEs {
	const { id, name, availableSpots, spots, classrooms, teachers = [] } = group;
	const endDate = new Date(group.periodEndAt || "");
	/**
	 * Semestre activo
	 * 2 semestres por año
	 *
	 * @example 2026-1
	 */
	const semestre = `${endDate.getFullYear()}-${endDate.getMonth() < 6 ? 1 : 2}`;

	return {
		id,
		grupo: `${name}`,
		cupos: `${availableSpots} de ${spots}`,
		espacios: classrooms?.filter((c) => !!c),
		profesores: teachers,
		horarios: group,
		inscrito: group,
		semestre,
		tipología: group.typology,
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
