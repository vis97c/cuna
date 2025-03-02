/**
 * Get purchase confirmation
 */
export default defineConditionallyCachedEventHandler((event) => {
	try {
		const params = getQuery(event);

		debugFirebaseServer(event, "api:confirm", params);

		return true;
	} catch (err) {
		if (isError(err)) serverLogger("api:confirm", err.message, err);

		throw err;
	}
});
