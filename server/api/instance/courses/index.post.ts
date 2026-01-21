import { Filter, Query } from "firebase-admin/firestore";

import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";

import type { CourseData } from "~~/functions/src/types/entities";
import type { eSIALevel, eSIAPlace, eSIATypology } from "~~/functions/src/types/SIA";

/**
 * Get the edges from the courses collection
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth, currentInstanceRef } = event.context;
	const Allow = "POST,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
		});

		// Only POST, HEAD & OPTIONS are allowed
		if (!["POST", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required
		if (!currentInstanceRef) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		// Require auth
		if (!currentAuth) {
			throw createError({ statusCode: 401, statusMessage: `Unauthorized` });
		}

		const params = getQuery(event);
		const page = getBoolean(params.page);
		const level = <eSIALevel | undefined>getQueryString("level", params);
		const place = <eSIAPlace | undefined>getQueryString("place", params);
		const typology = <eSIATypology | undefined>getQueryString("typology", params);

		// Level and place are required
		if (!level || !place) {
			throw createError({ statusCode: 400, statusMessage: "Missing parameters" });
		}

		debugFirebaseServer(event, "api:courses", params);

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		let query: Query<CourseData> = currentInstanceRef.collection("courses");

		query = query.where("level", "==", level); // where level equals
		query = query.where("place", "==", place); // where place equals
		query = query.orderBy("name"); // Order by name

		if (typology) {
			// where typology equals, 3 indexes
			query = query.where(
				Filter.or(
					Filter.where("typologiesIndexes.0", "==", typology),
					Filter.where("typologiesIndexes.1", "==", typology),
					Filter.where("typologiesIndexes.2", "==", typology)
				)
			);
		}

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:instance:courses", err);

		throw err;
	}
});
