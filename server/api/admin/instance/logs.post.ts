import type { CollectionReference, Query } from "firebase-admin/firestore";

import { eMemberRole } from "~~/functions/src/types/entities/index.ts";

/**
 * Get the edges from the "instance/logs" collection.
 *
 * @auth assistant
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentMember, currentInstance, currentInstanceRef } = event.context;
	const Allow = "POST,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Browser cache is not allowed
		});

		// Only POST, HEAD & OPTIONS are allowed
		if (!["POST", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required (Means we have a valid domain)
		if (!currentInstanceRef || !currentInstance) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		// Prevent listing if not assistant or bellow
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.MODERATOR) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
		}

		const params = getQuery(event);
		// List of origins to filter out
		const filter = Array.isArray(params.filter) ? params.filter : [params.filter];

		debugFirebaseServer(event, "api:admin:instance:logs", { filter });

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		let query: CollectionReference | Query = currentInstanceRef.collection("logs");

		// Get filtered logs
		if (filter.length) query = query.where("at", "not-in", filter);

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:admin:instance:logs", err);

		throw err;
	}
});
