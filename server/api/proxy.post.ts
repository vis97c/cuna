import { DocumentReference } from "firebase-admin/firestore";

import type { H3Context } from "@open-xamu-co/firebase-nuxt/server";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";

import type { ProxyData } from "~~/functions/src/types/entities";
import { eMemberRole } from "~~/functions/src/enums";

/**
 * Load proxies
 */
export default defineEventHandler(async (event) => {
	const { firebaseFirestore } = getFirebase("loadProxies");
	const { currentAuth } = <H3Context>event.context;
	const proxiesRef = firebaseFirestore.collection("proxies");

	try {
		if (!currentAuth || currentAuth.role > eMemberRole.DEVELOPER) {
			throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
		}

		const proxies: string[] = await readBody(event);
		const proxiesSnapshot = await proxiesRef.get();
		const existingProxies: string[] = proxiesSnapshot.docs.map((doc) => doc.data().proxy);

		await Promise.all(
			proxies.reduce(
				(acc, proxy) => {
					if (!existingProxies.includes(proxy)) {
						acc.push(proxiesRef.add({ proxy }));
					}

					return acc;
				},
				[] as Promise<DocumentReference<ProxyData>>[]
			)
		);
	} catch (err) {
		apiLogger(event, "api:proxies", err);

		throw err;
	}
});
