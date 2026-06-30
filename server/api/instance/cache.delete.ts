import type { H3Context } from "~~/server/types";
import { eMemberRole } from "~~/functions/src/types/entities";

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
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		// Prevent listing if not developer
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.DEVELOPER) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
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
