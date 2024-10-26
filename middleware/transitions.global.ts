export default defineNuxtRouteMiddleware((to) => {
	if (!process.client || !document.startViewTransition) return;

	// Disable built-in Vue transitions
	to.meta.pageTransition = false;
	to.meta.layoutTransition = false;
});
