import { defineStore, skipHydrate } from "pinia";
import { computed } from "vue";

import type { Instance, InstanceConfig } from "~/utils/types/index.ts";

export interface City {
	state?: { name: string };
	country?: { name: string };
	// internals
	name: string;
}

/**
 * Instance store
 * Handle current instance state
 *
 * @state
 */
export const useInstanceStore = defineStore("instance", () => {
	const { firebaseConfig, cache } = useRuntimeConfig().public;
	const instancePrefix = `instance.${firebaseConfig.projectId}`;
	// State
	const current = useState<Instance | undefined>(`${instancePrefix}.current`, () => undefined);
	const location = useState<string | undefined>(`${instancePrefix}.location`, () => undefined);
	/** Instance is fresh (session only) */
	const fresh = useState<boolean>(`${instancePrefix}.fresh`, () => false);

	// Getters
	const path = computed(() => current.value?.id || "");
	const config = computed<InstanceConfig>(() => ({
		...(current.value?.config as any),
	}));
	const maintenance = computed<string>(() => {
		const SESSION = useSessionStore();

		if (!config.value.maintenanceMessage || SESSION.canDevelop) return "";

		return config.value.maintenanceMessage;
	});
	const SIAMaintenance = computed(() => {
		const till = config.value.siaMaintenanceTillAt;

		if (!till) return false;

		return new Date(till) > new Date();
	});

	// Actions
	async function setInstance(instance?: Instance) {
		if (!instance) return;

		const url = instance.url;
		const logger = makeLogger({ instancePath: path.value });
		const { locationCountry, locationState, locationCity } = instance;

		current.value = { ...instance, url };

		// Prevent massive request on the server
		if (fresh.value || !locationCountry || !locationState || !locationCity) return;

		const endpoint = `${url}/_countries/${locationCountry}/${locationState}/${locationCity}`;

		fresh.value = true;

		try {
			// Fetch location, prefer $fetch
			const { data } = await $fetch<{ data?: City }>(endpoint, {
				query: { state: true, country: true },
				headers: { "Cache-Control": cache.longterm },
			});

			if (!data) return;

			location.value = `${data.name}. ${data.state?.name}. ${data.country?.name}.`;
		} catch (err) {
			logger("composables:useInstanceStore:setInstance", err);
		}
	}
	function unsetInstance() {
		location.value = undefined;
		current.value = undefined;
		fresh.value = false;
	}

	return {
		// Instance
		fresh: skipHydrate(fresh),
		current: skipHydrate(current),
		location: skipHydrate(location),
		// Getters
		path,
		config,
		maintenance,
		SIAMaintenance,
		// Actions
		setInstance,
		unsetInstance,
	};
});
