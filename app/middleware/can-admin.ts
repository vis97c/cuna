/**
 * Checks if user can admin
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const USER = useUserStore();

	// bypass rdr if token is expired
	if (USER.expiredToken) return;

	// User cannot admin
	if (!USER.canAdmin) {
		if (USER.canEdit) return navigateTo({ path: "/administrar" });

		return navigateTo({ path: "/" });
	}
});
