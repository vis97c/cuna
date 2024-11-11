import type { EventHandler, EventHandlerRequest, H3Event } from "h3";
import { getAuth } from "firebase-admin/auth";

import { apiFirebaseApp } from "./firebase";
import type { Instance, User } from "~/resources/types/entities";

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
export const defineConditionallyCachedEventHandler = <T extends EventHandlerRequest, D>(
	handler: (event: H3Event<T>, instance?: Instance) => D
): EventHandler<T, D> => {
	return defineEventHandler<T>(async (event) => {
		const authorization = getRequestHeader(event, "authorization");

		try {
			const { instance: instanceId } = useRuntimeConfig().public;
			const instanceRef = apiFirestore.collection("instances").doc(instanceId);
			const instanceSnapshot = await instanceRef.get();
			const instance: Instance | undefined = instanceSnapshot.data();

			if (!instance) throw new Error("Missing instance");

			const maxAge = (instance?.config?.coursesRefreshRate || 5) * 60;
			const cachedData = defineCachedEventHandler((e) => handler(e, instance), { maxAge });

			if (authorization) {
				// Validate authorization
				const auth = getAuth(apiFirebaseApp);
				const { uid } = await auth.verifyIdToken(authorization);
				const userRef = apiFirestore.collection("users").doc(uid);
				const userSnapshot = await userRef.get();
				const user: Partial<User> | undefined = userSnapshot.data();

				// Omit cache for moderators and above
				if ((user?.role ?? 3) < 3) return handler(event, instance);

				return cachedData(event);
			}

			// Prevent access from unauthorized users
			throw new Error("Unauthorized");
		} catch (err) {
			console.error(err);

			throw createError({
				statusCode: 401,
				statusMessage: "Unauthorized",
			});
		}
	});
};
