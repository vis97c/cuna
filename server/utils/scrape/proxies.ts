import { CollectionReference } from "firebase-admin/firestore";

import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";

import type { ProxyData } from "~~/functions/src/types/entities";

interface ExtendedProxyData extends ProxyData {
	/** Firestore document path */
	path: string;
}

/**
 * Get proxies
 */
export const getProxies = defineCachedFunction(
	async (event: ExtendedH3Event, debug = false) => {
		try {
			const { firebaseFirestore } = getFirebase("getPuppeteer");
			const proxiesRef: CollectionReference<ProxyData> =
				firebaseFirestore.collection("proxies");
			// Get proxies with score <= 1 and timeout <= 17 seconds
			const query = proxiesRef
				.where("disabled", "==", false)
				.where("score", "<=", 1)
				.where("timeout", "<=", 20);
			const proxiesSnapshot = await query.get();

			return proxiesSnapshot.docs.reduce<ExtendedProxyData[]>((acc, doc) => {
				const data = doc.data();
				const { proxy = "", timesDead = 1, timesAlive = 1 } = data;

				if (proxy) {
					// Bypass if death more than 90%
					if (!debug && timesDead > timesAlive * 0.9) return acc;

					acc.push({ ...data, path: doc.ref.path });
				}

				return acc;
			}, []);
		} catch (err) {
			apiLogger(event, "getProxies", err);

			// Prevent caching by throwing error
			throw err;
		}
	},
	{
		name: "getProxies",
		maxAge: 60 * 60 * 24, // 1 day
		getKey(event, _debug) {
			const { currentInstanceHost } = event.context;

			return `${currentInstanceHost}:proxies`;
		},
	}
);
