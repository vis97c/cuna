import { Filter, Query } from "firebase-admin/firestore";

import type { CourseData } from "~~/functions/src/types/entities";
import type { eSIALevel, eSIAPlace, eSIATypology } from "~~/functions/src/types/SIA";

/**
 * Get the edges from the courses collection
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentInstanceRef } = event.context;
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

		// Instance is required
		if (!currentInstanceRef) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		const params = getQuery(event);
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

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:instance:courses", err);

		throw err;
	}
});
