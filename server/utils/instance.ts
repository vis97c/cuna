import type { CollectionReference, DocumentSnapshot } from "firebase-admin/firestore";

import type { InstanceData } from "~~/functions/src/types/entities/index.ts";

import type { H3Context } from "../types";
import { debugFirebaseServer } from "./firestore";
import { getServerFirebase } from "./firebase";

/**
 * Get the current instance if it exists
 *
 * Forwarded host is prefered
 *
 * @see https://stackoverflow.com/a/51200572/3304008
 *
 * @cache 1 hour
 */
export const getInstance = defineCachedFunction(
	async (event, fullHost: string): Promise<NonNullable<H3Context["currentInstance"]>> => {
		const { production, forcedInstanceId } = useRuntimeConfig().public;
		const { firebaseFirestore } = getServerFirebase("api:getInstance");
		const instancesRef: CollectionReference<InstanceData> =
			firebaseFirestore.collection("instances");
		let snapshot: DocumentSnapshot<InstanceData>;
		const [host] = fullHost.split(":");

		debugFirebaseServer(event, "middleware:getInstance", host);

		if (forcedInstanceId) {
			// Use instance given from environment
			snapshot = await instancesRef.doc(forcedInstanceId).get();
		} else {
			// Use first instance matching the domain host
			const instancesQuery = await instancesRef
				.where("config.domains", "array-contains", host)
				.limit(1)
				.get();

			snapshot = instancesQuery.docs[0]; // get the first one

			if (!snapshot?.exists) {
				throw createError({
					statusCode: 404,
					statusMessage: `No instance found for ${host}`,
					cause: "NOT_FOUND",
				});
			}
		}

		/**
		 * Milliseconds from creation
		 *
		 * Use ToMillis for consistency
		 */
		const millis = snapshot.data()?.createdAt?.toMillis();
		const instance = await resolveServerRefs(event, snapshot, undefined, false);

		if (!instance?.id || !millis) {
			throw createError({
				statusCode: 502,
				statusMessage: `Invalid app instance for ${host}`,
				cause: "MALFORMED_DATA",
			});
		}

		let url = `https://${host}`;

		// Set URL on dev environments
		if (!production) url = `http://${fullHost}`;

		return {
			...instance,
			id: instance.id,
			url,
			millis,
		};
	},
	{
		name: "getInstance",
		maxAge: 60 * 60, // 1 hour
		getKey: (_, fullHost) => {
			const [host] = fullHost.split(":");

			return host;
		},
	}
);
