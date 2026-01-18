import { Filter, type Query } from "firebase-admin/firestore";

import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";
import { getWords, soundexEs } from "@open-xamu-co/firebase-nuxt/functions/search";

import type { CourseData } from "~~/functions/src/types/entities";
import { getQueryString } from "~~/server/utils/params";

/**
 * Search for courses by query params
 * Scrape SIA in the background
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async function (event) {
	const { currentInstanceRef } = event.context;
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
		const code = getQueryString("code", params);
		const level = getQueryString("level", params);
		const place = getQueryString("place", params);
		const faculty = getQueryString("faculty", params);
		const program = getQueryString("program", params);
		const typology = getQueryString("typology", params);

		let query: Query<CourseData> = currentInstanceRef.collection("courses");

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
		else if (name) {
			// Search by name instead
			const soundex = getWords(name).map(soundexEs).join(" ");

			if (!soundex) return null;
			if (level) query = query.where("level", "==", level); // where level equals
			if (place) query = query.where("place", "==", place); // where place equals
			if (faculty) query = query.where("faculty", "==", faculty); // where faculty equals
			if (program) {
				// where program equals, 6 indexes
				query = query.where(
					Filter.or(
						Filter.where("programsIndexes.0", "==", program),
						Filter.where("programsIndexes.1", "==", program),
						Filter.where("programsIndexes.2", "==", program),
						Filter.where("programsIndexes.3", "==", program),
						Filter.where("programsIndexes.4", "==", program)
					)
				);
			}

			query = query.orderBy("name").where("indexes", "array-contains", soundex);
		} else return null;

		if (typology) {
			// where typology equals, 3 indexes
			query = query.where(
				Filter.or(
					Filter.where("typologiesIndexes.0", "==", typology),
					Filter.where("typologiesIndexes.1", "==", typology),
					Filter.where("typologiesIndexes.2", "==", typology)
				)
			);
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
