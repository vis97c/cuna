/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(({ query, fullPath }) => {
	const SESSION = useSessionStore();

	const bannedUntil = SESSION.member?.bannedUntilAt
		? new Date(SESSION.member.bannedUntilAt)
		: null;
	const isBanned = bannedUntil ? bannedUntil > new Date() : false;

	if (isBanned) return navigateTo({ path: "/suspendido", query: { rdr: "auth-only" } });
	if (SESSION.token || SESSION.expiredToken) return;

	// User is not authenticated
	return navigateTo({
		path: "/ingresar",
		query: { ...query, restricted: encodeURI(fullPath), rdr: "auth-only" },
	});
});
