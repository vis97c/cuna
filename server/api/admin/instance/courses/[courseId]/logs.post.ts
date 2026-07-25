import { DocumentReference, Query } from "firebase-admin/firestore";

import {
	eMemberRole,
	type CourseData,
	type LogData,
} from "~~/functions/src/types/entities/index.ts";

/**
 * Get the edges from the logs collection by courseRef
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

		const params = getQuery(event);
		const courseId = getRouterParam(event, "courseId");

		debugFirebaseServer(event, "api:courses:logs:courseId", courseId, params);

		if (!courseId) {
			throw createError({
				statusCode: 400,
				statusMessage: `courseId is required`,
			});
		}

		// Prevent listing if not assistant or bellow
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.MODERATOR) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
		}

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		const courseRef: DocumentReference<CourseData> = currentInstanceRef
			.collection("courses")
			.doc(courseId);
		let query: Query<LogData> = currentInstanceRef.collection("logs");

		query = query.where("courseRef", "==", courseRef);

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:courses:logs:courseId", err);

		throw err;
	}
});
