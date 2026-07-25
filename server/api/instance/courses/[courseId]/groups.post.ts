import {
	Timestamp,
	type CollectionReference,
	type DocumentReference,
	type Query,
} from "firebase-admin/firestore";

import type { CourseData, GroupData } from "~~/functions/src/types/entities/index.ts";

import type { eSIATypology, uSIAFaculty, uSIAProgram } from "~~/functions/src/types/SIA/index.ts";

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentInstanceRef } = event.context;
	const Allow = "POST,HEAD";
	let courseRef: DocumentReference<CourseData> | undefined;

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

		const courseId = getRouterParam(event, "courseId");

		if (!courseId) {
			throw createError({ statusCode: 400, statusMessage: `courseId is required` });
		}

		const params = getQuery(event);
		const faculty = <uSIAFaculty | undefined>getQueryString("faculty", params);
		const program = <uSIAProgram | undefined>getQueryString("program", params);
		const typology = <eSIATypology | undefined>getQueryString("typology", params);

		// Faculty & program are required
		if (!faculty || !program) {
			throw createError({ statusCode: 400, statusMessage: "Missing faculty or program" });
		}

		debugFirebaseServer(event, "api:courses:logs:courseId:groups", {
			courseId,
			program,
			typology,
		});

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		/** Academic period threshold */
		const thresholdDate = new Date();

		// Set threshold of academic period to current date minus a month
		// This should return groups even a month after the period ended
		thresholdDate.setMonth(thresholdDate.getMonth() - 1);

		const thresholdTimestamp = Timestamp.fromDate(thresholdDate);

		// Get groups from active academic period
		const courseRef = currentInstanceRef.collection("courses").doc(courseId);
		const groupsRef: CollectionReference<GroupData> = courseRef.collection("groups");
		let query: Query<GroupData> = groupsRef
			.where("periodEndAt", ">=", thresholdTimestamp)
			.where("program", "==", program);

		// Filter by typology
		if (typology) query = query.where("typology", "==", typology);

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:instance:courses:courseId:groups", err, {
			courseRef: courseRef?.path,
		});

		throw err;
	}
});
