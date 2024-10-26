import { defineStore } from "pinia";

import type { Instance } from "~/resources/types/entities";
import type { City } from "~/functions/src/types/entities";

export interface iStateApp {
	instance?: Instance;
	location?: string;
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
			location: undefined,
		};
	},
	actions: {
		async setInstance(instance?: Instance) {
			if (!instance) return;

			const { locationCountry, locationState, locationCity } = instance;
			const { countriesUrl } = useRuntimeConfig().public;
			const url = `${countriesUrl}/${locationCountry}/${locationState}/${locationCity}`;

			this.instance = instance;

			if (this.location || !locationCountry || !locationState || !locationCity) return;

			try {
				const { data } = await $fetch<{ data?: City }>(url, {
					query: { state: true, country: true },
				});

				if (!data) return;

				this.location = `${data.name}. ${data.state?.name}. ${data.country?.name}.`;
			} catch (err) {
				console.error(err);
			}
		},
	},
});
