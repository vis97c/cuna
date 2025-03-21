import { CollectionReference, Query } from "firebase-admin/firestore";
import type { CourseData, LogData } from "~/functions/src/types/entities";

import { getBoolean } from "~/resources/utils/node";

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event, instance, auth) => {
	const { serverFirestore } = getServerFirebase();

	try {
		const courseId = getRouterParam(event, "courseId");
		const params = getQuery(event);
		const page = getBoolean(params.page);

		debugFirebaseServer(event, "api:courses:logs:courseId", courseId, params);

		if (!courseId) {
			throw createError({
				statusCode: 400,
				statusMessage: `courseId is required`,
			});
		}

		// Require admin auth
		if (!auth || auth.role > 1) {
			throw createError({ statusCode: 401, statusMessage: `Unauthorized` });
		}

		const coursesRef: CollectionReference<CourseData> = serverFirestore.collection("courses");
		const courseRef = coursesRef.doc(courseId);
		const logsRef: CollectionReference<LogData> = serverFirestore.collection("logs");

		let query: Query = logsRef.where("courseRef", "==", courseRef);

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage({ event, instance, auth }, query);
		else return getQueryAsEdges({ event, instance, auth }, query);
	} catch (err) {
		if (isError(err)) {
			serverLogger("api:courses:logs:courseId", err.message, { path: event.path, err });
		}

		throw err;
	}
});
