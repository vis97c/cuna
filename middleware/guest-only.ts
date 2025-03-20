/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async () => {
	const SESSION = useSessionStore();

	if (!SESSION.user) return;

	// User is authenticated
	return navigateTo("/", { redirectCode: 302 });
});
