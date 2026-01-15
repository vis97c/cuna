/**
 * Checks if user can admin
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const USER = useUserStore();

	// bypass rdr if token is expired
	if (USER.expiredToken) return;

	// User cannot develop
	if (!USER.canDevelop) {
		if (USER.canEdit) return navigateTo({ path: "/administrar" });

		return navigateTo({ path: "/" });
	}
});
