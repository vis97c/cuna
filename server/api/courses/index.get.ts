import { CollectionReference, Query } from "firebase-admin/firestore";
import type { CourseData } from "~/functions/src/types/entities";

import { getBoolean } from "~/resources/utils/node";

/**
 * Get the edges from the courses collection
 */
export default defineConditionallyCachedEventHandler(async (event, instance, auth) => {
	const { serverFirestore } = getServerFirebase();

	try {
		const params = getQuery(event);
		const page = getBoolean(params.page);

		debugFirebaseServer(event, "api:courses", params);

		// Require admin auth
		if (!auth || auth.role > 1) {
			throw createError({ statusCode: 401, statusMessage: `Unauthorized` });
		}

		const coursesRef: CollectionReference<CourseData> = serverFirestore.collection("courses");

		// Order at last
		const query: Query = getOrderedQuery(event, coursesRef.orderBy("scrapedWithErrorsAt"));

		if (page) return getEdgesPage({ event, instance, auth }, query);
		else return getQueryAsEdges({ event, instance, auth }, query);
	} catch (err) {
		if (isError(err)) {
			serverLogger("api:courses", err.message, { path: event.path, err });
		}

		throw err;
	}
});
