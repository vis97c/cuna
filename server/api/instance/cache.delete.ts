import { defineEventHandler, HTTPError } from "h3";

import type { H3Context } from "~~/server/types.ts";
import { eMemberRole } from "~~/functions/src/types/entities/index.ts";

/**
 * Clear cached instance
 *
 * @auth developer
 */
export default defineEventHandler(async (event) => {
	const { currentMember, currentInstanceHost } = <H3Context>event.context;

	try {
		// Instance is required (Means we have a valid domain)
		if (!currentInstanceHost) {
			throw new HTTPError("Missing instance", { status: 401 });
		}

		// Prevent listing if not developer
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.DEVELOPER) {
			throw new HTTPError("Insufficient permissions", { status: 401 });
		}

		const storage = useStorage("cache");

		// Remove cache
		await storage.removeItem(`nitro:functions:getInstance:${currentInstanceHost}.json`);

		return true;
	} catch (err) {
		apiLogger(event, "api:admin:instance:deleteCache", err);

		throw err;
	}
});
