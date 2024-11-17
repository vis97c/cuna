import { FieldPath, Query } from "firebase-admin/firestore";

import { getDocumentId } from "~/resources/utils/firestore";
import { getBoolean } from "~/resources/utils/node";
import { getOrderedQuery, getQueryAsEdges, debugFirebaseServer } from "~/server/utils/firebase";
import { defineConditionallyCachedEventHandler } from "~/server/utils/nuxt";

/**
 * Get the edges from a given collection
 */
export default defineConditionallyCachedEventHandler((event) => {
	try {
		const params = getQuery(event);
		const page = getBoolean(params.page);
		const collectionId = getRouterParam(event, "collectionId");

		debugFirebaseServer(event, "api:all:collection", collectionId);

		if (!collectionId) {
			throw createError({
				statusCode: 400,
				statusMessage: `collectionId is required`,
			});
		}

		let query: Query = apiFirestore.collection(collectionId);

		// filtered query cannot be mixed with any other query type
		if (params.include) {
			const documentId = FieldPath.documentId();
			let include = Array.isArray(params.include) ? params.include : [params.include];

			// clean & filter
			include = include.filter((uid) => uid && !getBoolean(uid)).map(getDocumentId);

			debugFirebaseServer(event, "getFilteredCollection", include);

			// Do not fetch empty list
			if (include.length) {
				/**
				 * limited subset of documents
				 *
				 * According to firebase docs, queries are limited to 30 disjuntion operations
				 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
				 */
				include = include.slice(0, Math.min(30, include.length));
				query = query.orderBy(documentId).where(documentId, "in", include);
			} else return []; // empty query
		} else query = getOrderedQuery(event, collectionId);

		if (page) return getEdgesPage(event, query);
		else return getQueryAsEdges(event, query);
	} catch (err) {
		console.error(err);

		return [];
	}
});
