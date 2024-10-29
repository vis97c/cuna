import type { EventHandler, EventHandlerRequest } from "h3";
import { getAuth } from "firebase-admin/auth";

import { apiFirebaseApp } from "./firebase";
import type { User } from "~/resources/types/entities";

/**
 * Conditionally cache event data.
 * Bypasses cahce for admin purposes
 *
 * @param handler event handler, should have its own error handling
 * @returns event handler
 */
export const defineConditionallyCachedEventHandler = <T extends EventHandlerRequest, D>(
	handler: EventHandler<T, D>
): EventHandler<T, D> => {
	/** Two minutes cache */
	const cachedData = defineCachedEventHandler(handler, { maxAge: 120 });

	return defineEventHandler<T>(async (event) => {
		const canModerate = getRequestHeader(event, "canModerate");

		try {
			if (canModerate) {
				// validate authorization
				const auth = getAuth(apiFirebaseApp);
				const { uid } = await auth.verifyIdToken(canModerate);
				const userRef = apiFirestore.collection("users").doc(uid);
				const userSnapshot = await userRef.get();
				const user: Partial<User> | undefined = userSnapshot.data();

				// omit cache for moderators and above
				if ((user?.role ?? 3) < 3) return handler(event);

				return cachedData(event);
			}

			// Prevent access from unauthorized users
			throw new Error("Unauthorized");
		} catch (error) {
			throw createError({
				statusCode: 401,
				statusMessage: "Unauthorized",
			});
		}
	});
};
