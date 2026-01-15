/**
 * Checks if user can edit
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const USER = useUserStore();

	// bypass rdr if token is expired
	if (USER.expiredToken) return;

	// User cannot edit
	if (!USER.canEdit) return navigateTo({ path: "/" });
});
