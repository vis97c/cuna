/**
 * Checks if user can admin
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ path }) => {
	const SESSION = useSessionStore();

	// Bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot develop
	if (!SESSION.canDevelop) {
		if (SESSION.canEdit) {
			return navigateTo({ path: "/administrar", query: { rdr: "can-develop" } });
		}

		// Avoid infinite redirect
		if (path === "/") return;

		return navigateTo({ path: "/", query: { rdr: "can-develop" } });
	}
});
