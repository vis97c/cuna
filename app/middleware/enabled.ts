/**
 * Instance is enabled
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();

	// Instance is disabled
	if (!SESSION.canDevelop && INSTANCE.current?.disabled) {
		return navigateTo(
			{ path: "/deshabilitado", query: { rdr: "enabled" } },
			{ redirectCode: 302 }
		);
	}
});
