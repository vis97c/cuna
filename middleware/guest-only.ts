/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async () => {
	const SESSION = useSessionStore();

	// User is authenticated
	if (SESSION.user) return navigateTo("/");
});
