/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async () => {
	const USER = useUserStore();

	// User is authenticated
	if (USER.token) return navigateTo("/", { redirectCode: 302 });
});
