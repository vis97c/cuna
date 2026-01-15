import type { H3Context } from "@open-xamu-co/firebase-nuxt/server";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";

import { safeInstanceConfig } from "~/utils/firestore";

/**
 * Get the current instance if it exists
 *
 * Middleware handles caching
 *
 * @auth guest
 */
export default defineEventHandler(async (event) => {
	const { currentInstance } = <H3Context>event.context;

	try {
		if (!currentInstance) return;

		return {
			...currentInstance,
			config: safeInstanceConfig(currentInstance?.config),
		};
	} catch (err) {
		apiLogger(event, "api:instance", err);

		throw err;
	}
});
