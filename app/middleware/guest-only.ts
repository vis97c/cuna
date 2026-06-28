/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ query }) => {
	const SESSION = useSessionStore();

	// User is authenticated
	if (SESSION.token) {
		return navigateTo(
			{ path: "/", query: { ...query, rdr: "guest-only" } },
			{ redirectCode: 302 }
		);
	}
});
