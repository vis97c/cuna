import { Filter, type CollectionReference, type Query } from "firebase-admin/firestore";

import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { apiLogger, getServerFirebase } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";

import { triGram } from "~/utils/firestore";
import { getQueryString } from "~~/server/utils/params";

/**
 * Search for courses by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async function (event) {
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

		const params = getQuery(event);
		const page = getBoolean(params.page);
		const name = getQueryString("name", params);
		const code = getQueryString("code", params);
		const level = getQueryString("level", params);
		const place = getQueryString("place", params);
		const faculty = getQueryString("faculty", params);
		const program = getQueryString("program", params);
		const typology = getQueryString("typology", params);

		let query: CollectionReference | Query = firebaseFirestore.collection("courses");
		let indexes: string[] = [];

		debugFirebaseServer(event, "api:courses:search", { name, code, program, typology, page });

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		// where code equals
		if (code) query = query.where("code", "==", code);
		else if (name && typeof name === "string") {
			// search by name instead
			indexes = triGram([name]);

			/**
			 * limited subset of documents
			 *
			 * According to firebase docs, queries are limited to 30 disjuntion operations
			 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
			 */
			indexes = indexes.slice(0, Math.min(10, indexes.length));

			if (!indexes.length) return null;
			if (level) query = query.where("level", "==", level); // where level equals
			if (place) query = query.where("place", "==", place); // where place equals
			if (faculty) query = query.where("faculty", "==", faculty); // where faculty equals
			if (program) {
				// where program equals
				if (indexes.length > 5 || typology) {
					query = query.where(
						Filter.or(
							Filter.where("programsIndexes.0", "==", program),
							Filter.where("programsIndexes.1", "==", program)
						)
					);
				} else {
					query = query.where(
						Filter.or(
							Filter.where("programsIndexes.0", "==", program),
							Filter.where("programsIndexes.1", "==", program),
							Filter.where("programsIndexes.2", "==", program),
							Filter.where("programsIndexes.3", "==", program)
						)
					);
				}
			}

			query = query.orderBy("name").where("indexes", "array-contains-any", indexes);
		} else return null;

		if (typology) {
			// where typology equals
			if (indexes.length > 5) {
				query = query.where("typologiesIndexes.0", "==", typology);
			} else {
				query = query.where(
					Filter.or(
						Filter.where("typologiesIndexes.0", "==", typology),
						Filter.where("typologiesIndexes.1", "==", typology)
					)
				);
			}
		}

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:courses:search", err);

		throw err;
	}
});
