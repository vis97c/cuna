/**
 * Instance is enabled
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();

	// Instance is disabled
	if (!SESSION.canDevelop && INSTANCE.current?.disabledAt) {
		return navigateTo("/deshabilitado", { redirectCode: 302 });
	}
});
