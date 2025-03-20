/**
 * Checks if user can moderate
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const SESSION = useSessionStore();

	// bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot moderate
	if (!SESSION.canModerate) return navigateTo({ path: "/ingresar" });
});
