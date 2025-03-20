/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ fullPath }) => {
	const SESSION = useSessionStore();

	if (SESSION.token || SESSION.expiredToken) return;

	// User is not authenticated
	return navigateTo({ path: "/ingresar", query: { restricted: encodeURI(fullPath) } });
});
