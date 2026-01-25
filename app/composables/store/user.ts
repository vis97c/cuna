import {
	arrayRemove,
	arrayUnion,
	deleteField,
	doc,
	updateDoc,
	type DocumentReference,
} from "firebase/firestore";

import type {
	Course,
	ExtendedInstanceMember,
	ExtendedInstanceMemberRef,
	ExtendedUser,
	Group,
} from "~/utils/types";
import {
	eSIABogotaFaculty,
	eSIALevel,
	eSIAPlace,
	eSIAScienceBogotaProgram,
	type uSIAFaculty,
	type uSIAProgram,
} from "~~/functions/src/types/SIA";

import type { CookieOptions } from "#app";

const cookieOptionsDefaults = {
	sameSite: "strict",
	maxAge: 365 * 24 * 60 * 60, // 1 year
} satisfies CookieOptions;

/**
 * User store
 *
 * @state
 */
export const useUserStore = defineStore("user", () => {
	const SESSION = useSessionStore();
	const { production } = useRuntimeConfig().public;
	const cookieOptions = {
		...cookieOptionsDefaults,
		secure: production,
		partitioned: production,
	} satisfies CookieOptions;

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
	/**
	 * Include non-regular enrollment slots
	 * PAES, PEAMA
	 */
	const withNonRegular = useCookie<boolean>("user.withNonRegular", {
		...cookieOptions,
		default: () => false,
	});

	// Getters
	const role = computed<number>(() => SESSION.user?.role ?? 3);
	const canDevelop = computed<boolean>(() => role.value < 0);
	const canAdmin = computed<boolean>(() => role.value < 1 || canDevelop.value);
	const canEdit = computed<boolean>(() => role.value < 2 || canAdmin.value);
	const canModerate = computed<boolean>(() => role.value < 3 || canEdit.value);
	const userName = computed<string>(() => {
		const fullName = (SESSION.user?.name || "").split(" ");
		const [firstName = "Sin Nombre", secondName = "", firstLastName = ""] = fullName;

		return `${firstName} ${firstLastName || secondName}`.trim();
	});
	const enrolled = computed<Group[]>({
		get() {
			return SESSION.user?.enrolled || [];
		},
		set(value) {
			if (!SESSION.token) return;

			SESSION.setUser({ ...SESSION.user, enrolled: value }, SESSION.token);
		},
	});

	// Action overrides
	// Override unsetSession to also reset user preferences
	// Provide auth from client context
	function unsetSession(expiredToken = false) {
		SESSION.unsetSession(expiredToken);

		track.value = [];
		// Reset preferences
		level.value = eSIALevel.PREGRADO;
		place.value = eSIAPlace.BOGOTÁ;
		lastFacultySearch.value = eSIABogotaFaculty.CIENCIAS;
		lastProgramSearch.value = eSIAScienceBogotaProgram.CC;
		withNonRegular.value = false;
	}
	function logout() {
		const { $clientAuth } = useNuxtApp();

		return SESSION.logout($clientAuth, unsetSession);
	}
	function remove() {
		const { $clientAuth } = useNuxtApp();

		return SESSION.remove($clientAuth);
	}

	// Actions
	function trackCourse(course: Course) {
		if (!course.code || track.value.includes(course.code)) return;

		track.value.push(course.code);
	}
	function untrackCourse(course: Course) {
		if (!course.code || !track.value.includes(course.code)) return;

		track.value = track.value.filter((code) => code !== course.code);
	}
	function setLastSearch(newFaculty: uSIAFaculty, newProgram: uSIAProgram) {
		lastFacultySearch.value = newFaculty;
		lastProgramSearch.value = newProgram;
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

		if (import.meta.server || !$clientFirestore || !SESSION.token) return;

		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			$clientFirestore,
			SESSION.path
		);
		const groupRef: DocumentReference<Group> = doc($clientFirestore, group.id || "");

		// Update enrolled, do not await
		updateDoc(memberRef, { enrolledRefs: arrayUnion(groupRef) });

		const filteredGroups = enrolled.value.filter(({ id }) => id !== group.id);

		// Hydrate user
		enrolled.value = [...filteredGroups, group];
	}
	function unenroll(group: Group) {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !SESSION.token) return;

		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			$clientFirestore,
			SESSION.path
		);
		const groupRef: DocumentReference<Group> = doc($clientFirestore, group.id || "");

		// Update enrolled, do not await
		updateDoc(memberRef, { enrolledRefs: arrayRemove(groupRef) });

		// Hydrate user
		enrolled.value = enrolled.value.filter(({ id }) => id !== group.id);
	}

	const clearEnrolled = async () => {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !SESSION.token) return;

		const Swal = useSwal();
		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			$clientFirestore,
			SESSION.path
		);

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

	// To refs
	const sessionRefs = storeToRefs(SESSION);

	return {
		// Session
		...sessionRefs,
		user: sessionRefs.user as Ref<
			(ExtendedUser & Omit<ExtendedInstanceMember, "user">) | undefined
		>,
		setUser: SESSION.setUser,
		// User
		track,
		level,
		place,
		lastFacultySearch,
		lastProgramSearch,
		withNonRegular,
		// User getters
		canModerate,
		canEdit,
		canAdmin,
		canDevelop,
		userName,
		enrolled,
		// User overrides
		unsetSession,
		logout,
		remove,
		// User actions
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
