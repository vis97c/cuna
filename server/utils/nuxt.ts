import type { EventHandler, EventHandlerRequest, H3Event } from "h3";
import { FirebaseAuthError } from "firebase-admin/auth";

import type { Instance } from "~/resources/types/entities";

export function getQueryParam<T>(name: string, e: H3Event): T {
	const params = getQuery(e);

	return Array.isArray(params[name]) ? params[name][0] : params[name];
}

/**
 * Get current auth
 *
 * @cache 2 minutes
 */
export const getInstance = defineCachedFunction(
	async function () {
		const { serverFirestore } = getServerFirebase();
		const { instance: instanceId } = useRuntimeConfig().public;
		const instanceRef = serverFirestore.collection("instances").doc(instanceId);
		const instanceSnapshot = await instanceRef.get();
		const instance: Instance | undefined = instanceSnapshot.data();

		return instance;
	},
	{
		name: "getInstance",
		maxAge: 120, // 2 minutes
		getKey() {
			const { instance: instanceId } = useRuntimeConfig().public;

			return instanceId;
		},
	}
);

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
		const instance = await getInstance();

		if (!instance) throw createError({ statusMessage: "Missing instance", statusCode: 503 });

		try {
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
		} catch (error) {
			if (error instanceof FirebaseAuthError) {
				if (error.code === "auth/id-token-expired") return handler(event, instance);
			}

			// Unknown error
			serverLogger("server:utils:nuxt", "Unknown error", error);

			return handler(event, instance);
		}
	});
}
