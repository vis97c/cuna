/**
 * Checks if user can edit
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ path }) => {
	const SESSION = useSessionStore();

	// Bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot edit
	if (!SESSION.canEdit) {
		// Avoid infinite redirect
		if (path === "/") return;

		return navigateTo({ path: "/", query: { rdr: "can-edit" } });
	}
});
