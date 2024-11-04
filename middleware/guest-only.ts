/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async () => {
	const SESSION = useSessionStore();

	if (import.meta.server || !SESSION.user) return;

	// User is authenticated
	return navigateTo("/cursos", { redirectCode: 302 });
});
