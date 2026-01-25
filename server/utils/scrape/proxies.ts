import { CollectionReference, Query } from "firebase-admin/firestore";

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
export function makeGetProxies(debug?: boolean) {
	return defineCachedFunction(
		async (event: ExtendedH3Event) => {
			try {
				const { firebaseFirestore } = getFirebase("getPuppeteer");
				const proxiesRef: CollectionReference<ProxyData> =
					firebaseFirestore.collection("proxies");
				// Get proxies with score <= 1 and timeout <= 17 seconds
				let query: Query<ProxyData> = proxiesRef.where("disabled", "==", false);

				// Be less strict with proxies in debug mode
				if (debug) {
					// Useful to reevaluate proxies locally
					query = query.where("score", "<=", 10).where("timeout", "<=", 60);
				} else {
					query = query.where("score", "<=", 2).where("timeout", "<=", 30);
				}

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
			getKey(event) {
				const { currentInstanceHost } = event.context;

				return `${currentInstanceHost}:proxies`;
			},
		}
	);
}
