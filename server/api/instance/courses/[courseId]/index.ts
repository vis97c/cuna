/**
 * Get a course by courseId
 *
 * @auth
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentInstance, currentInstanceRef } = event.context;
	const Allow = "POST,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Browser cache is not allowed
		});

		// Only GET, HEAD & OPTIONS are allowed
		if (!["POST", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required
		if (!currentInstance || !currentInstanceRef) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		const coursesRef = currentInstanceRef.collection("courses");
		const courseId = getRouterParam(event, "courseId");

		debugFirebaseServer(event, "api:instance:courses:[courseId]", courseId);

		if (!courseId) {
			throw createError({ statusCode: 400, statusMessage: "courseSlug is required" });
		}

		const courseRef = coursesRef.doc(courseId);
		const snapshot = await courseRef.get();

		// Check if course exists
		if (!snapshot?.exists) {
			throw createError({ statusCode: 404, statusMessage: "Course not found" });
		}

		// Bypass body for HEAD requests
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		return resolveServerRefs(event, snapshot);
	} catch (err) {
		apiLogger(event, "api:instance:members:courses:[courseSlug]", err);

		throw err;
	}
});
