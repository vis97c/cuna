import { defineStore } from "pinia";
import { deleteUser, getAuth } from "firebase/auth";
import { doc, deleteField, updateDoc, DocumentReference } from "firebase/firestore";

import type { Course, User } from "~/resources/types/entities";
import {
	eSIABogotaFaculty,
	eSIALevel,
	eSIAPlace,
	eSIAScienceBogotaProgram,
	type uSIAFaculty,
	type uSIAProgram,
} from "~/functions/src/types/SIA";
import type { EnrolledGroup } from "~/functions/src/types/entities";

export interface iStateSession {
	user?: User;
	token?: string;
	expiredToken: boolean;
	/**
	 * Courses to track (ids)
	 */
	track: string[];
	level: eSIALevel;
	place: eSIAPlace;
	lastFacultySearch: uSIAFaculty;
	lastProgramSearch: uSIAProgram;
	/**
	 * Include non-regular enrollment slots
	 * PAES, PEAMA
	 */
	withNonRegular: boolean;
}

/**
 * Session store
 *
 * @state
 */
export const useSessionStore = defineStore("session", {
	persist: true,
	state: (): iStateSession => {
		return {
			user: undefined,
			token: undefined,
			expiredToken: false,
			track: [],
			level: eSIALevel.PREGRADO,
			place: eSIAPlace.BOGOTÁ,
			lastFacultySearch: eSIABogotaFaculty.CIENCIAS,
			lastProgramSearch: eSIAScienceBogotaProgram.CC,
			withNonRegular: false,
		};
	},
	getters: {
		/** users/uid */
		id({ user }) {
			return user ? `users/${user?.uid}` : "";
		},
		userName({ user }) {
			const fullName = (user?.name || "").split(" ");
			const [firstName = "Sin Nombre", secondName = "", firstLastName = ""] = fullName;

			return `${firstName} ${firstLastName || secondName}`.trim();
		},
		enrolled({ user }) {
			return user?.enrolled || {};
		},
		canModerate({ user }) {
			const role = user?.role ?? 3;

			return role < 3;
		},
		canEdit({ user }) {
			const role = user?.role ?? 3;

			return role < 2;
		},
		canAdmin({ user }) {
			const role = user?.role ?? 3;

			return role < 1;
		},
		canDevelop({ user }) {
			const role = user?.role ?? 3;
			const { production } = useRuntimeConfig().public;

			return role < 0 || !production;
		},
	},
	actions: {
		setUser(user: User, token: string) {
			// role is only present server side
			this.user = { ...this.user, ...user };
			this.token = token;
			this.expiredToken = false;
		},
		unsetSession(expiredToken = false) {
			this.track = [];
			this.user = this.token = undefined;
			this.expiredToken = expiredToken;
			// Reset preferences
			this.level = eSIALevel.PREGRADO;
			this.place = eSIAPlace.BOGOTÁ;
			this.lastFacultySearch = eSIABogotaFaculty.CIENCIAS;
			this.lastProgramSearch = eSIAScienceBogotaProgram.CC;
			this.withNonRegular = false;
		},
		async logout() {
			if (import.meta.server) return;

			const { $clientFirebaseApp } = useNuxtApp();
			const router = useRouter();
			const Swal = useSwal();

			const { value } = await Swal.firePrevent({
				title: "Cerrar sesion",
				text: "¿Esta seguro de querer cerrar sesion?",
			});

			if (value) {
				await getAuth($clientFirebaseApp).signOut();
				router.push("/"); // rdr & reload page
			}
		},
		async remove() {
			if (import.meta.server) return;

			const { $clientFirebaseApp } = useNuxtApp();
			const router = useRouter();
			const Swal = useSwal();

			const { value } = await Swal.firePrevent({
				title: "Eliminar cuenta",
				text: "¿Esta seguro de querer eliminar tu cuenta?",
				footer: "Borraremos toda tu información, esta acción no es reversible, aunque puedes volver a registrarte mas tarde",
			});

			const user = getAuth($clientFirebaseApp).currentUser;

			if (user && value) {
				await deleteUser(user);
				router.push("/"); // rdr & reload page
			}
		},
		trackCourse(course: Course) {
			if (!course.code || this.track.includes(course.code)) return;

			this.track.push(course.code);
		},
		untrackCourse(course: Course) {
			if (!course.code || !this.track.includes(course.code)) return;

			this.track = this.track.filter((code) => code !== course.code);
		},
		setLastSearch(faculty: uSIAFaculty, program: uSIAProgram) {
			this.lastFacultySearch = faculty;
			this.lastProgramSearch = program;
		},
		setLevel(level: eSIALevel) {
			this.level = level;
		},
		setPlace(place: eSIAPlace) {
			this.place = place;
		},
		toggleNonRegular(this, newValue = !this.withNonRegular) {
			this.withNonRegular = newValue;
		},
		enroll({ name, schedule, teachers, courseId, courseCode, courseName }: EnrolledGroup) {
			const { $clientFirestore } = useNuxtApp();

			if (import.meta.server || !$clientFirestore) return;

			const userRef: DocumentReference<User> = doc($clientFirestore, this.id);
			const enroll = { name, schedule, teachers, courseId, courseCode, courseName };

			// Update enrolled, do not await
			updateDoc(userRef, { [`enrolled.${courseCode}`]: enroll });
		},
		unenroll(courseCode: string) {
			const { $clientFirestore } = useNuxtApp();

			if (import.meta.server || !$clientFirestore) return;

			const userRef: DocumentReference<User> = doc($clientFirestore, this.id);

			// Update enrolled, do not await
			updateDoc(userRef, { [`enrolled.${courseCode}`]: deleteField() });
		},
	},
});
