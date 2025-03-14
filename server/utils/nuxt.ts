import type { EventHandler, EventHandlerRequest, H3Event } from "h3";

import type { Instance } from "~/resources/types/entities";

export function getQueryParam<T>(name: string, e: H3Event): T {
	const params = getQuery(e);

	return Array.isArray(params[name]) ? params[name][0] : params[name];
}

/**
 * Conditionally cache event data.
 * Bypasses cache for admin purposes
 *
 * @param handler event handler, should have its own error handling
 * @returns event handler
 */
export function defineConditionallyCachedEventHandler<T extends EventHandlerRequest, D>(
	handler: (
		event: H3Event<T>,
		instance?: Instance,
		auth?: { role: number; uid: string; id: string }
	) => D
): EventHandler<T, D> {
	return defineEventHandler<T>(async function (event) {
		const { serverFirestore } = getServerFirebase();
		const { instance: instanceId } = useRuntimeConfig().public;
		const instanceRef = serverFirestore.collection("instances").doc(instanceId);
		const instanceSnapshot = await instanceRef.get();
		const instance: Instance | undefined = instanceSnapshot.data();

		if (!instance) throw new Error("Missing instance");

		const auth = await getAuth(event);
		const maxAge = (instance?.config?.coursesRefreshRate || 5) * 60;
		const cachedData = defineCachedEventHandler(
			function (e) {
				return handler(e, instance, auth);
			},
			{ maxAge }
		);

		// Omit cache for moderators and above
		if ((auth?.role ?? 3) < 3) return handler(event, instance, auth);

		return cachedData(event);
	});
}
