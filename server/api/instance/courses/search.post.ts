import { Filter, type Query } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

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

import type { CourseData, ExtendedInstanceDataConfig } from "~~/functions/src/types/entities";
import type {
	eSIALevel,
	eSIAPlace,
	uSIAFaculty,
	uSIAProgram,
	eSIATypology,
} from "~~/functions/src/types/SIA";
import { getQueryString } from "~~/server/utils/params";
import type { iCoursesPayload, tCoursesSearchMode } from "~~/functions-scrapper/src/types/scrapper";
import type { ExtendedH3Event } from "~~/server/types";

/**
 * Triggers courses scrape from SIA
 */
function makeTriggerCoursesScrape(maxAgeMinutes: number) {
	const { cfScrapeCoursesUrl } = useRuntimeConfig();

	return defineCachedFunction(
		async (event: ExtendedH3Event, payload: iCoursesPayload) => {
			const { currentInstance, currentAuth } = event.context;

			if (!currentInstance || !currentAuth) {
				throw new Error("Missing instance or authorization");
			}

			const response = await $fetch(cfScrapeCoursesUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: { instancePath: currentInstance?.id, payload },
			});

			if (!response) throw new Error("Scraping failed or omitted");

			return payload;
		},
		{
			name: "triggerCoursesScrape",
			maxAge: 60 * maxAgeMinutes,
			getKey(event, payload) {
				const { currentInstanceHost } = event.context;
				const { level, place, faculty, program, typology } = payload;
				const values = [level, place, faculty, program, typology || ""];
				const hash = createHash("sha256").update(values.join(",")).digest("hex");

				// Compact hash
				return `${currentInstanceHost}:${hash}`;
			},
		}
	);
}

/**
 * Search for courses by query params
 * Scrape SIA in the background
 *
 * Implements soundex search for name similarity
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async function (event) {
	const { currentAuth, currentInstanceRef, currentInstance, currentInstanceHost } = event.context;
	const config: ExtendedInstanceDataConfig = currentInstance?.config || {};
	const Allow = "POST,HEAD";

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

		const params = getQuery(event);
		const page = getBoolean(params.page);
		const name = getQueryString("name", params);
		const code = getQueryString("code", params);
		const level = <eSIALevel | undefined>getQueryString("level", params);
		const place = <eSIAPlace | undefined>getQueryString("place", params);
		const faculty = <uSIAFaculty | undefined>getQueryString("faculty", params);
		const program = <uSIAProgram | undefined>getQueryString("program", params);
		const typology = <eSIATypology | undefined>getQueryString("typology", params);
		const searchMode = <tCoursesSearchMode | undefined>getQueryString("searchMode", params);

		// Level, place, faculty and program are required
		if (!level || !place || !faculty || !program) {
			throw createError({ statusCode: 400, statusMessage: "Missing search parameters" });
		}

		debugFirebaseServer(event, "api:courses:search", {
			name,
			code,
			level,
			place,
			faculty,
			program,
			typology,
			searchMode,
			page,
		});

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		let query: Query<CourseData> = currentInstanceRef.collection("courses");

		query = query.where("level", "==", level); // where level equals
		query = query.where("place", "==", place); // where place equals

		// where code equals (exact match)
		if (code) query = query.where("code", "==", code);
		else if (name) {
			// Search by name instead
			const soundex = soundexEs(getWords(name).join(""));

			if (!soundex) return null;

			// // where faculty equals, 3 indexes
			// query = query.where(
			// 	Filter.or(
			// 		Filter.where("facultyIndexes.0", "==", faculty),
			// 		Filter.where("facultyIndexes.1", "==", faculty),
			// 		Filter.where("facultyIndexes.2", "==", faculty)
			// 	)
			// );

			if (!typology) {
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

			debugFirebaseServer(event, "api:courses:search:name", { soundex });

			// Get by matching indexes
			query = query.where("indexes", "array-contains", soundex);
			// Order by search relevance then name
			query = query.orderBy("indexesWeights", "desc").orderBy("name");

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
		} else return null;

		// Check if already scraped
		if (currentAuth && currentInstanceRef) {
			const storage = useStorage("cache");
			const cacheValues = [level, place, faculty, program, typology];
			const cacheHash = createHash("sha256").update(cacheValues.join(",")).digest("hex");
			const cacheKey = `nitro:functions:getCoursesLinks:${currentInstanceHost}:${cacheHash}.json`;
			const cacheDuration = config.coursesScrapeRate ?? 1440;

			// Get cached item, do not await
			storage.getItem(cacheKey).then((cachedLinks) => {
				if (cachedLinks) return;

				const triggerCoursesScrape = makeTriggerCoursesScrape(cacheDuration);

				// Scrape courses in the background, do not await
				// Since this is a search endpoint it needs to be as fast as possible
				// The scraper uses proxies and it can take a while to scrape the old SIA site
				// TODO: Pre-index all courses periodically since they are not updated often across places
				triggerCoursesScrape(event, { level, place, faculty, program, typology });
			});
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
