/**
 * Instance is enabled
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(() => {
	const INSTANCE = useInstanceStore();
	const USER = useUserStore();

	// Instance is disabled
	if (!USER.canDevelop && INSTANCE.current?.disabledAt) {
		return navigateTo("/deshabilitado", { redirectCode: 302 });
	}
});
