/**
 * Checks if user can moderate
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ path }) => {
	const SESSION = useSessionStore();

	// Bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot moderate
	if (!SESSION.canModerate) {
		// Avoid infinite redirect
		if (path === "/") return;

		return navigateTo({ path: "/", query: { rdr: "can-moderate" } });
	}
});
