import { CollectionReference, Query } from "firebase-admin/firestore";

import type { tLogger } from "@open-xamu-co/ui-common-types";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

interface ExtendedProxyData {
	[key: string]: any;
	/** Firestore document path */
	path: string;
}

/**
 * Get proxies
 */
export async function getProxies(logger: tLogger, debug?: boolean) {
	const { firebaseFirestore } = getFirebase("getPuppeteer");
	const proxiesRef: CollectionReference = firebaseFirestore.collection("proxies");

	try {
		let query: Query = proxiesRef;

		// Get proven proxies only
		// Get proxies with score <= 2 and timeout <= 30 seconds
		if (!debug) {
			query = query
				.where("disabled", "==", false)
				.where("score", "<=", 2)
				.where("timeout", "<=", 30);
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
		logger("functions:scrapper:getProxies", err);

		// Prevent caching by throwing error
		throw err;
	}
}
