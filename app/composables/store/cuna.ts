import type { FromData } from "@open-xamu-co/firebase-nuxt/client";

import type { ExtendedInstanceDataConfig } from "~~/functions/src/types/entities";

/**
 * Cuna store
 *
 * @state
 */
export const useCunaStore = defineStore("cuna", () => {
	const APP = useAppStore();
	const INSTANCE = useInstanceStore();

	// Getters
	const config = computed<FromData<ExtendedInstanceDataConfig>>(() => ({
		...(INSTANCE.current?.config as any),
	}));
	const maintenance = computed<string>(() => {
		const USER = useUserStore();

		if (!config.value.maintenanceMessage || USER.canDevelop) return "";

		return config.value.maintenanceMessage;
	});
	const SIAMaintenance = computed(() => {
		const till = config.value.siaMaintenanceTillAt;

		if (!till) return false;

		return new Date(till) > new Date();
	});

	// Actions

	// To refs
	const appRefs = storeToRefs(APP);

	return {
		// App
		...appRefs,
		useQueue: APP.useQueue,
		clearQueue: APP.clearQueue,
		setTvMQRange: APP.setTvMQRange,
		setLaptopMQRange: APP.setLaptopMQRange,
		setTabletMQRange: APP.setTabletMQRange,
		setMobileMQRange: APP.setMobileMQRange,
		setSmartwatchMQRange: APP.setSmartwatchMQRange,
		saveThumbnail: APP.saveThumbnail,
		// Cuna getters
		config,
		maintenance,
		SIAMaintenance,
	};
});
