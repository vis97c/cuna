/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async () => {
	const SESSION = useSessionStore();

	if (!SESSION.token) return;

	// User is authenticated
	return navigateTo("/", { redirectCode: 302 });
});
