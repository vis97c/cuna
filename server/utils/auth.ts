import type { H3Event } from "h3";
import { createHash } from "node:crypto";

/**
 * Get current auth
 *
 * @cache 2 minutes
 */
export const getAuth = defineCachedFunction(
	async (event: H3Event, authorization: string) => {
		const { serverAuth } = getServerFirebase();
		const { uid } = await serverAuth.verifyIdToken(authorization);

		return uid;
	},
	{
		name: "getAuth",
		maxAge: 120, // 2 minutes
		getKey(event, authorization: string) {
			return createHash("sha256").update(authorization).digest("hex");
		},
	}
);
