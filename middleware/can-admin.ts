/**
 * Checks if user can admin
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const SESSION = useSessionStore();

	// bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot admin
	if (!SESSION.canAdmin) {
		if (SESSION.canEdit) return navigateTo({ path: "/administrar" });

		return navigateTo({ path: "/ingresar" });
	}
});
