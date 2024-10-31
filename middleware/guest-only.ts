/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async ({ path, query }, from) => {
	const SESSION = useSessionStore();

	if (import.meta.server || !SESSION.user) return;

	const { restricted } = query;
	const { restricted: restrictedFrom } = from.query;

	// Prevent infinite redirects
	if (restricted || restrictedFrom || path === "/") return;

	// User is authenticated
	return navigateTo("/", { redirectCode: 302 });
});
