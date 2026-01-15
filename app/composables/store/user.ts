import { deleteField, doc, updateDoc, type DocumentReference } from "firebase/firestore";

import type {
	Course,
	ExtendedInstanceMember,
	ExtendedInstanceMemberRef,
	ExtendedUser,
} from "~/utils/types";
import {
	eSIABogotaFaculty,
	eSIALevel,
	eSIAPlace,
	eSIAScienceBogotaProgram,
	type uSIAFaculty,
	type uSIAProgram,
} from "~~/functions/src/types/SIA";
import type { EnrolledGroup } from "~~/functions/src/types/entities";

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
	const enrolled = computed<Exclude<ExtendedUser["enrolled"], undefined>>(() => {
		return SESSION.user?.enrolled || {};
	});

	// Actions
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
	function enroll({ name, schedule, teachers, courseId, courseCode, courseName }: EnrolledGroup) {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !SESSION.token) return;

		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			$clientFirestore,
			SESSION.path
		);
		const enroll = { name, schedule, teachers, courseId, courseCode, courseName };

		// Update enrolled, do not await
		updateDoc(memberRef, { [`enrolled.${courseCode}`]: enroll });

		// Hydrate user
		SESSION.setUser(
			{ ...SESSION.user, enrolled: { ...SESSION.user?.enrolled, [courseCode]: enroll } },
			SESSION.token
		);
	}
	function unenroll(courseCode: string) {
		const { $clientFirestore } = useNuxtApp();

		if (import.meta.server || !$clientFirestore || !SESSION.token) return;

		const memberRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
			$clientFirestore,
			SESSION.path
		);

		// Update enrolled, do not await
		updateDoc(memberRef, { [`enrolled.${courseCode}`]: deleteField() });

		// Hydrate user
		SESSION.setUser(
			{ ...SESSION.user, enrolled: { ...SESSION.user?.enrolled, [courseCode]: undefined } },
			SESSION.token
		);
	}

	// To refs
	const sessionRefs = storeToRefs(SESSION);

	return {
		// Session
		...sessionRefs,
		user: sessionRefs.user as Ref<
			(ExtendedUser & Omit<ExtendedInstanceMember, "user">) | undefined
		>,
		setUser: SESSION.setUser,
		logout: SESSION.logout,
		remove: SESSION.remove,
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
		// User actions
		unsetSession,
		trackCourse,
		untrackCourse,
		setLastSearch,
		setLevel,
		setPlace,
		toggleNonRegular,
		enroll,
		unenroll,
	};
});
