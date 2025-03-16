import type { CollectionReference, Query } from "firebase-admin/firestore";

import { getBoolean } from "~/resources/utils/node";
import { triGram } from "~/resources/utils/firestore";

/**
 * Search for teachers by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async (event, instance, auth) => {
	const { serverFirestore } = getServerFirebase();

	try {
		const params = getQuery(event);
		const name: string = Array.isArray(params.name) ? params.name[0] : params.name;
		const courses = Array.isArray(params.courses) ? params.courses : [params.courses];
		const page = getBoolean(params.page);
		let query: CollectionReference | Query = serverFirestore.collection("teachers");

		debugFirebaseServer(event, "api:teachers", params);

		// Require auth
		if (!auth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

		if (name) {
			// search by name
			const indexes = triGram([name]);

			query = query.orderBy("name").where("indexes", "array-contains-any", indexes);
		} else if (params.courses && courses.length) {
			/**
			 * limited subset of documents
			 *
			 * According to firebase docs, queries are limited to 30 disjuntion operations
			 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
			 */
			courses.length = Math.min(30, courses.length);
			query = query.where("courses", "array-contains-any", courses);
		} else return null;

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage({ event, instance, auth }, query);
		else return getQueryAsEdges({ event, instance, auth }, query);
	} catch (err) {
		if (isError(err)) {
			serverLogger("api:teachers", err.message, { path: event.path, err });
		}

		throw err;
	}
});
