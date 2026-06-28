import type { Query } from "firebase-admin/firestore";

import type { NoteData } from "~~/functions/src/types/entities";
import type { Note } from "~/utils/types";
import { getFirebase } from "~~/functions/src/utils/firebase";
import { decrypt } from "~~/functions/src/utils/encrypt";

/**
 * Get edges from the "notes" collection.
 * Personal notes only
 *
 * @auth
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { firebaseFirestore } = getFirebase("api:instance:members:notes");
	const { currentMember, currentMemberRef, currentInstanceRef, currentInstanceMillis } =
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
			if (!currentMember) {
				throw createError({ statusCode: 401, statusMessage: "Missing auth" });
			}

			// Personal notes only
			query = query.where("createdByRef", "==", currentMemberRef);
		} else {
			// Public notes only
			query = query.where("public", "==", true);
		}

		const resolver = new QueryResolver(event, query);
		const results = await resolver.resolve();

		if (!Array.isArray(results)) {
			// Decode bodies
			for (let i = 0; i < results.edges.length; i++) {
				// Omit notes from other instances
				if (!results.edges[i].node.id.startsWith(currentInstanceRef.path)) {
					results.edges.splice(i, 1);

					continue;
				}

				try {
					// Decrypt body
					results.edges[i].node.body = decrypt(
						results.edges[i].node.body,
						currentInstanceMillis
					);
				} catch (err) {
					// Remove the edge if body can't be decrypted
					results.edges.splice(i, 1);
					apiLogger(event, "api:instance:members:notes:page:decode", err);
				}
			}

			return results;
		}

		// Decode bodies
		for (let i = 0; i < results.length; i++) {
			// Omit notes from other instances
			if (!results[i].node.id.startsWith(currentInstanceRef.path)) {
				results.splice(i, 1);

				continue;
			}

			try {
				// Decrypt body
				results[i].node.body = decrypt(results[i].node.body, currentInstanceMillis);
			} catch (err) {
				// Remove the edge if body can't be decrypted
				results.splice(i, 1);
				apiLogger(event, "api:instance:members:notes:edges:decode", err);
			}
		}

		return results;
	} catch (err) {
		apiLogger(event, "api:instance:members:notes", err);

		throw err;
	}
});
