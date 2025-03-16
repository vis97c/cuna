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
