import type { CollectionReference, Query } from "firebase-admin/firestore";

import { getBoolean } from "~/resources/utils/node";
import { debugFirebaseServer, getOrderedQuery, getEdgesPage } from "~/server/utils/firebase";
import { defineConditionallyCachedEventHandler } from "~/server/utils/nuxt";
import { triGram } from "~/resources/utils/firestore";

/**
 * Search for teachers by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	try {
		const params = getQuery(event);
		const name: string = Array.isArray(params.name) ? params.name[0] : params.name;
		const courses = Array.isArray(params.courses) ? params.courses : [params.courses];
		const page = getBoolean(params.page);
		let query: CollectionReference | Query = apiFirestore.collection("teachers");

		debugFirebaseServer(event, "api:teachers", params);

		if (name) {
			// search by name
			const indexes = triGram([name]);

			query = query.orderBy("indexes").where("indexes", "array-contains-any", indexes);
		} else if (courses.length) {
			query = query.where("courses", "array-contains-any", courses);
		} else return null;

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);
		else return getQueryAsEdges(event, query);
	} catch (err) {
		console.error(err);

		return null;
	}
});
