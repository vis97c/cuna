import { createHash } from "node:crypto";
import { type H3Event } from "h3";
import { defineCachedFunction } from "nitropack/runtime";

import type { Member } from "~/utils/types";

import type { H3Context } from "../types";
import { resolveServerRefs } from "./firestore";
import { getServerFirebase } from "./firebase";

/**
 * Get current member
 *
 * @cache 1 hour
 */
export const getMember = defineCachedFunction(
	async function (
		event: H3Event,
		authorization?: string
	): Promise<H3Context["currentMember"] | undefined> {
		if (!authorization) return;

		const { firebaseAuth } = getServerFirebase("api:getAuth");
		const { currentInstanceRef, currentInstance } = <H3Context>event.context;

		// Instance is required (Means we have a valid domain)
		if (!currentInstanceRef || !currentInstance) return;

		const membersRef = currentInstanceRef.collection("members");
		const { uid } = await firebaseAuth.verifyIdToken(authorization);
		const snapshot = await membersRef.doc(uid).get();
		const memberData: Member | undefined = await resolveServerRefs(
			event,
			snapshot,
			{ level: 0 },
			true
		);
		/**
		 * Milliseconds from update
		 */
		const millis = snapshot.data()?.updatedAt?.toMillis();

		return { ...memberData, millis, uid, id: `${currentInstance.id}/members/${uid}` };
	},
	{
		name: "getMember",
		maxAge: 60 * 60, // 1 hour
		getKey(_, authorization) {
			if (!authorization) return "guest";

			// Compact hash
			return createHash("sha256").update(authorization).digest("hex");
		},
	}
);
