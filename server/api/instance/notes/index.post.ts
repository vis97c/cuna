import type { Query } from "firebase-admin/firestore";

import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { decrypt } from "@open-xamu-co/firebase-nuxt/functions/encrypt";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { NoteData } from "~~/functions/src/types/entities";
import type { Note } from "~/utils/types";

/**
 * Get edges from the "notes" collection.
 * Personal notes only
 *
 * @auth
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { firebaseFirestore } = getFirebase("api:instance:members:notes");
	const { currentAuth, currentAuthRef, currentInstanceRef, currentInstanceMillis } =
		event.context;
	const Allow = "POST,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Browser cache is not allowed
		});

		// Only GET, HEAD & OPTIONS are allowed
		if (!["POST", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required
		if (!currentInstanceRef || !currentInstanceMillis) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		// Group collection
		const notesRef = firebaseFirestore.collectionGroup("notes");
		const params = getQuery(event);
		const asPage = getBoolean(params.page);
		const personal = getBoolean(params.personal);

		debugFirebaseServer(event, "api:instance:members:notes", params);

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		let query: Query<NoteData, Note> = notesRef;

		if (personal) {
			// Auth is required for personal notes
			if (!currentAuth) {
				throw createError({ statusCode: 401, statusMessage: "Missing auth" });
			}

			// Personal notes only
			query = query.where("createdByRef", "==", currentAuthRef);
		} else {
			// Public notes only
			query = query.where("public", "==", true);
		}

		// order at last
		query = getOrderedQuery(event, query);

		if (asPage) {
			const page = await getEdgesPage(event, query);

			// Decode bodies
			for (let i = 0; i < page.edges.length; i++) {
				try {
					// Group collection could fail attempting to decrypt notes from other instances
					page.edges[i].node.body = decrypt(
						page.edges[i].node.body,
						currentInstanceMillis
					);
				} catch (err) {
					// Remove the edge if body can't be decrypted
					page.edges.splice(i, 1);
					apiLogger(event, "api:instance:members:notes:page:decode", err);
				}
			}

			return page;
		}

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);
		const edges = await getQueryAsEdges(event, query.limit(first));

		// Decode bodies
		for (let i = 0; i < edges.length; i++) {
			try {
				// Group collection could fail attempting to decrypt notes from other instances
				edges[i].node.body = decrypt(edges[i].node.body, currentInstanceMillis);
			} catch (err) {
				// Remove the edge if body can't be decrypted
				edges.splice(i, 1);
				apiLogger(event, "api:instance:members:notes:edges:decode", err);
			}
		}

		return edges;
	} catch (err) {
		apiLogger(event, "api:instance:members:notes", err);

		throw err;
	}
});
