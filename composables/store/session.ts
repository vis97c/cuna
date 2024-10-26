import { defineStore } from "pinia";
import { getAuth } from "firebase/auth";

import type { BagProductVariant, ProductVariant, User } from "~/resources/types/entities";
import type { iPageEdge } from "@open-xamu-co/ui-common-types";

export interface iStateSession {
	user?: User;
	token?: string;
	expiredToken: boolean;
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
	},
});
