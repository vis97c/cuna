import { CollectionReference, Query } from "firebase-admin/firestore";

import { apiLogger, getServerFirebase } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import type { LogData } from "@open-xamu-co/firebase-nuxt/functions";

import type { CourseData } from "~~/functions/src/types/entities";

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth } = event.context;
	const { firebaseFirestore } = getServerFirebase();
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
		if (!currentAuth || currentAuth.role > 1) {
			throw createError({ statusCode: 401, statusMessage: `Unauthorized` });
		}

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		const coursesRef: CollectionReference<CourseData> = firebaseFirestore.collection("courses");
		const courseRef = coursesRef.doc(courseId);
		const logsRef: CollectionReference<LogData> = firebaseFirestore.collection("logs");

		let query: Query = logsRef.where("courseRef", "==", courseRef);

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:courses:logs:courseId", err);

		throw err;
	}
});
