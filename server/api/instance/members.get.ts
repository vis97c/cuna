import type { CollectionReference, Query } from "firebase-admin/firestore";

import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";

import type { ExtendedInstanceMember } from "~/utils/types";
import { eMemberRole } from "~~/functions/src/enums";

/**
 * Get the edges from the "members" collection.
 *
 * @auth moderator
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth, currentInstance, currentInstanceRef } = event.context;
	const { rootInstanceId } = useRuntimeConfig().public;
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

		const membersRef: CollectionReference<ExtendedInstanceMember> =
			currentInstanceRef.collection("members");
		const params = getQuery(event);
		const guest = getBoolean(params.guest);
		const page = getBoolean(params.page);

		debugFirebaseServer(event, "api:instance:members", params);

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

		let query: CollectionReference | Query = membersRef;

		// Keep root members out
		if (currentInstance.id !== `instances/${rootInstanceId}`) {
			query = query.where("role", ">", eMemberRole.DEVELOPER);
		}

		// Get only visible members
		if (!guest) query = query.where("role", "<=", eMemberRole.MODERATOR);

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:instance:members", err);

		throw err;
	}
});
