import type { CollectionReference, Query } from "firebase-admin/firestore";

import type { LogData } from "@open-xamu-co/firebase-nuxt/functions";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import { eMemberRole } from "~~/functions/src/enums";

/**
 * Get the edges from the "instance/logs" collection.
 *
 * @auth moderator
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { firebaseFirestore } = getFirebase();
	const { currentAuth, currentInstance, currentInstanceRef } = event.context;
	const Allow = "GET,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
		});

		// Only GET, HEAD & OPTIONS are allowed
		if (!["GET", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required
		if (!currentInstanceRef || !currentInstance) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		const logsRef: CollectionReference<LogData> = firebaseFirestore.collection("logs");
		const params = getQuery(event);
		// List of origins to filter out
		const filter = Array.isArray(params.filter) ? params.filter : [params.filter];
		const page = getBoolean(params.page);

		debugFirebaseServer(event, "api:instance:logs", params);

		// Require auth
		if (!currentAuth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

		// Prevent listing if not moderator or bellow
		if (currentAuth.role > eMemberRole.MODERATOR) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
		}

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		let query: CollectionReference | Query = logsRef;

		// Get filtered logs
		if (filter.length) query = query.where("at", "not-in", filter);

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:instance:logs", err);

		throw err;
	}
});
