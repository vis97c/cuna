/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ fullPath, path, query }, from) => {
	const SESSION = useSessionStore();

	if (import.meta.server || SESSION.token || SESSION.expiredToken) return;

	const { restricted } = query;
	const { restricted: restrictedFrom } = from.query;

	// Prevent infinite redirects
	if (restricted || restrictedFrom || path === "/ingresar") return;

	// User is not authenticated
	return navigateTo(
		{ path: "/ingresar", query: { restricted: encodeURI(fullPath) } },
		{ redirectCode: 302 }
	);
});
