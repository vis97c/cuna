import { defineConditionallyCachedEventHandler } from "../utils/nuxt";

/**
 * Get purchase confirmation
 */
export default defineConditionallyCachedEventHandler((event) => {
	try {
		const params = getQuery(event);

		debugFirebaseServer(event, "api:confirm", params);

		return true;
	} catch (err) {
		console.error(err);

		return null;
	}
});
