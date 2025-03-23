import type { DocumentReference } from "firebase-admin/firestore";
import type { H3Event } from "h3";
import { createHash } from "node:crypto";
import type { UserData } from "~/functions/src/types/entities";

import type { User } from "~/resources/types/entities";

/**
 * Get current auth
 *
 * @cache 2 minutes
 */
export const getAuth = defineCachedFunction(
	async function (event: H3Event, authorization?: string) {
		const { serverAuth, serverFirestore } = getServerFirebase();

		if (!authorization) return;

		const { uid } = await serverAuth.verifyIdToken(authorization);
		const userRef: DocumentReference<UserData, User> = serverFirestore
			.collection("users")
			.doc(uid);
		const userSnapshot = await userRef.get();
		const { role = 3, ...user } = userSnapshot.data() || {};

		return { ...user, uid, id: `users/${uid}`, role };
	},
	{
		name: "getAuth",
		maxAge: 120, // 2 minutes
		getKey(event, authorization) {
			if (!authorization) return "guest";

			return createHash("sha256").update(authorization).digest("hex");
		},
	}
);
