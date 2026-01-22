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

		const {
			maintenanceMessage,
			siaMaintenanceTillAt,
			explorerV1MaintenanceTillAt,
			explorerV2MaintenanceTillAt,
			losEstudiantesUrl,
			losEstudiantesCoursesPath,
			losEstudiantesProfessorsPath,
			version,
		} = currentInstance?.config || {};

		/** Be explicit about what is exposed to the client */
		const publicConfig = {
			maintenanceMessage,
			siaMaintenanceTillAt,
			explorerV1MaintenanceTillAt,
			explorerV2MaintenanceTillAt,
			losEstudiantesUrl,
			losEstudiantesCoursesPath,
			losEstudiantesProfessorsPath,
			version,
		};

		return {
			...currentInstance,
			config: safeInstanceConfig(publicConfig),
		};
	} catch (err) {
		apiLogger(event, "api:instance", err);

		throw err;
	}
});
