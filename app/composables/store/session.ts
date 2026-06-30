import {
	arrayRemove,
	arrayUnion,
	deleteField,
	doc,
	DocumentReference,
	updateDoc,
} from "firebase/firestore";
import { deleteUser, type Auth } from "firebase/auth";
import { defineStore, skipHydrate } from "pinia";
import { computed } from "vue";

import type { Course, Group, Member, MemberRef } from "~/utils/types";
import {
	eSIALevel,
	eSIAPlace,
	type uSIAFaculty,
	eSIABogotaFaculty,
	type uSIAProgram,
	eSIAScienceBogotaProgram,
	eSIATypology,
} from "~~/functions/src/types/SIA";
import { eMemberRole } from "~~/functions/src/types/entities";

import type { CookieOptions } from "#app";

const cookieOptionsDefaults = {
	sameSite: "strict",
	maxAge: 365 * 24 * 60 * 60, // 1 year
} satisfies CookieOptions;

/**
 * Session store
 * Handle authentication state
 *
 * Token is to large, so this store should handle its own cookie
 * useDocumentCreate, useDocumentUpdate & useDocumentDelete can't be used here due to circular references
 *
 * @state
 */
export const useSessionStore = defineStore("session", () => {
	const { firebaseConfig, production } = useRuntimeConfig().public;
	const sessionPrefix = `session.${firebaseConfig.projectId}`;
	const cookieOptions = {
		...cookieOptionsDefaults,
		secure: production,
		partitioned: production,
	} satisfies CookieOptions;

	// State
	const token = useCookie<string | null>(`${sessionPrefix}.token`, {
		...cookieOptions,
		default: () => null,
	});
	const expiredToken = useCookie<boolean>(`${sessionPrefix}.expiredToken`, {
		...cookieOptions,
		default: () => false,
	});
	const member = useState<Member | undefined>(`${sessionPrefix}.member`, () => undefined);
	/** This is needed for the middleware */
	const role = useCookie<number>(`${sessionPrefix}.role`, {
		...cookieOptions,
		default: () => member.value?.role ?? eMemberRole.GUEST,
	});
	/**
	 * Courses to track (ids)
	 */
	const track = useCookie<string[]>("user.track", {
		...cookieOptions,
		default: () => [],
	});
	const level = useCookie<eSIALevel>("user.level", {
		...cookieOptions,
		default: () => eSIALevel.PREGRADO,
	});
	const place = useCookie<eSIAPlace>("user.place", {
		...cookieOptions,
		default: () => eSIAPlace.BOGOTÁ,
	});
	const lastFacultySearch = useCookie<uSIAFaculty>("user.lastFacultySearch", {
		...cookieOptions,
		default: () => eSIABogotaFaculty.CIENCIAS,
	});
	const lastProgramSearch = useCookie<uSIAProgram>("user.lastProgramSearch", {
		...cookieOptions,
		default: () => eSIAScienceBogotaProgram.CC,
	});
	const lastTypologySearch = useState<eSIATypology | undefined>("user.lastTypologySearch");
	/**
	 * Include non-regular enrollment slots
	 * PAES, PEAMA
	 */
	const withNonRegular = useCookie<boolean>("user.withNonRegular", {
		...cookieOptions,
		default: () => false,
	});

	// Getters
	/** The member auth platform uid */
	const id = computed(() => {
		return getDocumentId(member.value?.id);
	});
	/**
	 * User firestore path
	 * Path or empty string if no session is available
	 */
	const path = computed<string>(() => member.value?.id || "");
	const canDevelop = computed<boolean>(() => role.value < 0);
	const canAdmin = computed<boolean>(() => role.value < 1 || canDevelop.value);
	const canEdit = computed<boolean>(() => role.value < 2 || canAdmin.value);
	const canModerate = computed<boolean>(() => role.value < 3 || canEdit.value);
	const canStudy = computed<boolean>(() => role.value < 4 || canModerate.value);
	const userName = computed<string>(() => {
		const fullName = (member.value?.name || "").split(" ");
		const [firstName = "Sin Nombre", secondName = "", firstLastName = ""] = fullName;

		return `${firstName} ${firstLastName || secondName}`.trim();
	});
	const enrolled = computed<Group[]>({
		get() {
			return member.value?.enrolled || [];
		},
		set(value) {
			if (!token.value || !member.value) return;

			setMember({ ...member.value, enrolled: value }, token.value);
		},
	});

	// Actions
	function setToken(newToken: string, newExpiredToken = false) {
		token.value = newToken || null;
		expiredToken.value = newExpiredToken;
	}
	function setMember({ createdAt, updatedAt, ...memberData }: Member, token: string): void {
		member.value = { ...member.value, ...memberData };
		role.value = memberData.role ?? eMemberRole.GUEST;
		setToken(token, false);
	}
	function unsetSession(expiredToken = false): void {
		setToken("", expiredToken);
		member.value = undefined;
		role.value = eMemberRole.GUEST;
		track.value = [];
		// Reset preferences
		level.value = eSIALevel.PREGRADO;
		place.value = eSIAPlace.BOGOTÁ;
		lastFacultySearch.value = eSIABogotaFaculty.CIENCIAS;
		lastProgramSearch.value = eSIAScienceBogotaProgram.CC;
		lastTypologySearch.value = undefined;
		withNonRegular.value = false;
	}
	/**
	 * Logout user
	 * @param clientAuth Firebase auth client
	 * @param unsetSessionFn Function to unset session data
	 */
	async function logout(): Promise<void> {
		if (import.meta.server) return;

		const { $clientAuth } = useNuxtApp();

		const Swal = useSwal();
		const { value } = await Swal.firePrevent({
			title: "Cerrar sesion",
			text: "¿Esta seguro de querer cerrar sesion?",
		});

		if (value) {
			unsetSession();
			await $clientAuth?.signOut();
			window.location.href = "/"; // rdr & reload page
		}
	}
	/**
	 * Remove user
	 * @param clientAuth Firebase auth client
	 */
	async function remove(clientAuth?: Auth) {
		if (import.meta.server) return;

		const Swal = useSwal();

		const { value } = await Swal.firePrevent({
			title: "Eliminar cuenta",
			text: "¿Esta seguro de querer eliminar tu cuenta?",
			footer: "Borraremos toda tu información, esta acción no es reversible, aunque puedes volver a registrarte mas tarde",
		});

		const user = clientAuth?.currentUser;

		if (user && value) {
			await deleteUser(user);
			window.location.href = "/"; // rdr & reload page
		}
	}
	function trackCourse(course: Course) {
		if (!course.code || track.value.includes(course.code)) return;

		track.value.push(course.code);
	}
	function untrackCourse(course: Course) {
		if (!course.code || !track.value.includes(course.code)) return;

		track.value = track.value.filter((code) => code !== course.code);
	}
	function setLastSearch(
		newFaculty: uSIAFaculty,
		newProgram: uSIAProgram,
		newTypology?: eSIATypology
	) {
		lastFacultySearch.value = newFaculty;
		lastProgramSearch.value = newProgram;
		lastTypologySearch.value = newTypology || undefined;
	}
	function setLevel(newLevel: eSIALevel) {
		level.value = newLevel;
	}
	function setPlace(newPlace: eSIAPlace) {
		place.value = newPlace;
	}
	function toggleNonRegular(newValue = !withNonRegular.value) {
		withNonRegular.value = newValue;
	}
	function enroll(group: Group) {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !token.value) return;

		const memberRef: DocumentReference<MemberRef> = doc($clientFirestore, path.value);
		const groupRef: DocumentReference<Group> = doc($clientFirestore, group.id || "");

		// Update enrolled, do not await
		updateDoc(memberRef, { enrolledRefs: arrayUnion(groupRef) });

		const filteredGroups = enrolled.value.filter(({ id }) => id !== group.id);

		// Hydrate user
		enrolled.value = [...filteredGroups, group];
	}
	function unenroll(group: Group) {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !token.value) return;

		const memberRef: DocumentReference<MemberRef> = doc($clientFirestore, path.value);
		const groupRef: DocumentReference<Group> = doc($clientFirestore, group.id || "");

		// Update enrolled, do not await
		updateDoc(memberRef, { enrolledRefs: arrayRemove(groupRef) });

		// Hydrate user
		enrolled.value = enrolled.value.filter(({ id }) => id !== group.id);
	}

	const clearEnrolled = async () => {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !token.value) return;

		const Swal = useSwal();
		const memberRef: DocumentReference<MemberRef> = doc($clientFirestore, path.value);

		const { value } = await Swal.firePrevent({
			title: "Limpiar horario",
			text: "¿Esta seguro de querer limpiar tu horario?",
			footer: "Puedes volver a organizarlo mas tarde",
		});

		if (!value) return;

		// Update enrolled, do not await
		updateDoc(memberRef, { enrolledRefs: deleteField() });

		// Hydrate user
		enrolled.value = [];
	};

	return {
		// Member
		token: skipHydrate(token),
		expiredToken: skipHydrate(expiredToken),
		member: skipHydrate(member),
		track,
		level,
		place,
		lastFacultySearch,
		lastProgramSearch,
		lastTypologySearch,
		withNonRegular,
		// Member getters
		id,
		path,
		canStudy,
		canModerate,
		canEdit,
		canAdmin,
		canDevelop,
		userName,
		enrolled,
		// Member actions
		setMember,
		unsetSession,
		logout,
		remove,
		trackCourse,
		untrackCourse,
		setLastSearch,
		setLevel,
		setPlace,
		toggleNonRegular,
		enroll,
		unenroll,
		clearEnrolled,
	};
});
