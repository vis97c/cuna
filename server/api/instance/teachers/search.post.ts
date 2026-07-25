import type { CollectionReference, Query } from "firebase-admin/firestore";

import type { CourseData } from "~~/functions/src/types/entities/index.ts";
import { getWords, soundexEs } from "~~/functions/src/utils/search";

/**
 * Search for teachers by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentMember, currentInstanceRef } = event.context;
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

		const params = getQuery(event);
		const name = getQueryString("name", params);
		const courses = Array.isArray(params.courses) ? params.courses : [params.courses];
		const coursesRefs: CollectionReference<CourseData> =
			currentInstanceRef.collection("courses");
		let query: CollectionReference | Query = currentInstanceRef.collection("teachers");

		debugFirebaseServer(event, "api:teachers", params);

		// Require auth
		if (!currentMember) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		if (name) {
			// search by name
			const soundex = soundexEs(getWords(name).join(""));

			if (!soundex) return null;

			debugFirebaseServer(event, "api:teachers:search:name", { soundex });

			// Get by matching indexes
			query = query.where("indexes", "array-contains", soundex);
			// Order by search relevance
			query = query.orderBy("indexesWeights", "desc").orderBy("name");
		} else if (params.courses && courses.length) {
			const refs = courses.map((id) => coursesRefs.doc(id));

			/**
			 * limited subset of documents
			 *
			 * According to firebase docs, queries are limited to 30 disjuntion operations
			 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
			 */
			refs.length = Math.min(30, refs.length);

			query = query.where("coursesRefs", "array-contains-any", refs);
		} else return null;

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:teachers", err);

		throw err;
	}
});
