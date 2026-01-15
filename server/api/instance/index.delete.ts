import type { H3Context } from "@open-xamu-co/firebase-nuxt/server";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";

import { eMemberRole } from "~~/functions/src/enums";

/**
 * Clear cached instance
 *
 * @auth developer
 */
export default defineEventHandler(async (event) => {
	const { currentAuth, currentInstanceHost } = <H3Context>event.context;

	try {
		// Instance is required
		if (!currentInstanceHost) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		if (!currentAuth || currentAuth.role > eMemberRole.DEVELOPER) {
			throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
		}

		const storage = useStorage("cache");

		// Remove cache
		await storage.removeItem(`nitro:functions:getInstance:${currentInstanceHost}.json`);

		return true;
	} catch (err) {
		apiLogger(event, "api:instance:deleteCache", err);

		throw err;
	}
});
