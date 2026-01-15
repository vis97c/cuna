/**
 * Checks if user can moderate
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const USER = useUserStore();

	// bypass rdr if token is expired
	if (USER.expiredToken) return;

	// User cannot moderate
	if (!USER.canModerate) return navigateTo({ path: "/" });
});
