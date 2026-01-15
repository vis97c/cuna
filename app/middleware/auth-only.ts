/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ fullPath }) => {
	const USER = useUserStore();

	if (USER.token || USER.expiredToken) return;

	// User is not authenticated
	return navigateTo({ path: "/ingresar", query: { restricted: encodeURI(fullPath) } });
});
