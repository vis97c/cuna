import { defineStore } from "pinia";

import type { Instance } from "~/resources/types/entities";

export interface iStateApp {
	instance?: Instance;
}

/**
 * Session store
 *
 * @state
 */
export const useAppStore = defineStore("app", {
	persist: true,
	state: (): iStateApp => {
		return {
			instance: undefined,
		};
	},
	getters: {
		maintenance({ instance = {} }): string {
			const SESSION = useSessionStore();

			if (!instance?.config?.maintenanceMessage || SESSION.canDevelop) return "";

			return instance?.config?.maintenanceMessage;
		},
		SIAMaintenance({ instance = {} }) {
			const till = instance?.config?.siaMaintenanceTillAt;

			if (!till) return false;

			return till > new Date();
		},
	},
	actions: {
		async setInstance(instance?: Instance) {
			if (!instance) return;

			this.instance = instance;
		},
		unsetInstance() {
			this.instance = undefined;
		},
	},
});
