import type { H3Context } from "~~/server/types";

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
			/** Be explicit about what is exposed to the client */
			config: {},
		};
	} catch (err) {
		apiLogger(event, "api:instance", err);

		throw err;
	}
});
