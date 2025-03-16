/**
 * Checks if user can edit
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const SESSION = useSessionStore();

	// bypass rdr if token is expired
	if (SESSION.expiredToken) return;

	// User cannot edit
	if (!SESSION.canEdit) return navigateTo({ path: "/" });
});
