import { defineStore } from "pinia";
import { getAuth } from "firebase/auth";

import type { Course, User } from "~/resources/types/entities";
import {
	eSIABogotaFaculty,
	eSIAScienceBogotaProgram,
	type uSIAFaculty,
	type uSIAProgram,
} from "~/functions/src/types/SIA";

export interface iStateSession {
	user?: User;
	token?: string;
	expiredToken: boolean;
	/**
	 * Courses to track (code)
	 */
	track: string[];
	lastFacultySearch: uSIAFaculty;
	lastProgramSearch: uSIAProgram;
}

/**
 * Session store
 *
 * @state
 */
export const useSessionStore = defineStore("session", {
	persist: {
		paths: ["user", "token", "expiredToken", "bag"],
	},
	state: (): iStateSession => {
		return {
			user: undefined,
			token: undefined,
			expiredToken: false,
			track: [],
			lastFacultySearch: eSIABogotaFaculty.CIENCIAS,
			lastProgramSearch: eSIAScienceBogotaProgram.CC,
		};
	},
	getters: {
		id({ user }) {
			return user ? `users/${user?.uid}` : "";
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

			return role < 0;
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
			this.user = this.token = undefined;
			this.expiredToken = expiredToken;
		},
		async logout() {
			if (!process.client) return;

			const { $clientFirebaseApp } = useNuxtApp();
			const Swal = useSwal();

			const { value } = await Swal.firePrevent({
				title: "Cerrar sesion",
				text: "¿Esta seguro de querer cerrar sesion?",
			});

			if (value) {
				await getAuth($clientFirebaseApp).signOut();
				window.location.href = "/"; // rdr & reload page
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
	},
});
