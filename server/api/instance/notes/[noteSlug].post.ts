import { Filter, type Query } from "firebase-admin/firestore";

import {
	debugFirebaseServer,
	resolveServerDocumentRefs,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { decrypt } from "@open-xamu-co/firebase-nuxt/functions/encrypt";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { NoteData } from "~~/functions/src/types/entities";
import type { Note } from "~/utils/types";

/**
 * Get a note using its slug
 * Decode body
 *
 * @auth
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

		// Auth is required
		if (!currentAuth) {
			throw createError({ statusCode: 401, statusMessage: "Missing auth" });
		}

		// Group collection
		const notesRef = firebaseFirestore.collectionGroup("notes");
		const noteSlug = getRouterParam(event, "noteSlug");

		debugFirebaseServer(event, "api:instance:members:notes:[noteSlug]", noteSlug);

		if (!noteSlug) {
			throw createError({ statusCode: 400, statusMessage: "noteSlug is required" });
		}

		let query: Query<NoteData, Note> = notesRef;

		query = query.where("slug", "==", noteSlug);

		// Show note if public or if user is owner
		query = query.where(
			Filter.or(
				Filter.where("public", "==", true),
				Filter.where("createdByRef", "==", currentAuthRef)
			)
		);

		const notesSnapshot = await query.limit(1).get();
		const [snapshot] = notesSnapshot.docs; // get the first one if any

		if (!snapshot?.exists) {
			throw createError({ statusCode: 404, statusMessage: "Note not found" });
		}

		// Bypass body for HEAD requests
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		const note = await resolveServerDocumentRefs(event, snapshot);
		// Decode note body using instance timestamp
		const body = decrypt(note?.body || "", currentInstanceMillis);

		return { ...note, body };
	} catch (err) {
		apiLogger(event, "api:instance:members:notes:[noteSlug]", err);

		throw err;
	}
});
