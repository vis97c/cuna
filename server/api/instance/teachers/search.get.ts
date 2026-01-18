import type { CollectionReference, Query } from "firebase-admin/firestore";

import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import { getWords, soundexEs } from "@open-xamu-co/firebase-nuxt/functions/search";

/**
 * Search for teachers by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth, currentInstanceRef } = event.context;
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

		// Instance is required
		if (!currentInstanceRef) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		const params = getQuery(event);
		const page = getBoolean(params.page);
		const name = getQueryString("name", params);
		const courses = Array.isArray(params.courses) ? params.courses : [params.courses];
		let query: CollectionReference | Query = currentInstanceRef.collection("teachers");

		debugFirebaseServer(event, "api:teachers", params);

		// Require auth
		if (!currentAuth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		if (name) {
			// search by name
			const soundex = getWords(name).map(soundexEs).join(" ");

			query = query.orderBy("name").where("indexes", "array-contains", soundex);
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

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:teachers", err);

		throw err;
	}
});
