import {
	type CollectionReference,
	FieldValue,
	Filter,
	type Query,
	Timestamp,
} from "firebase-admin/firestore";
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
import {
	getWords,
	soundexEs,
	getWeightedSearchIndexes,
} from "@open-xamu-co/firebase-nuxt/functions/search";

import type { iCoursesPayload } from "~~/server/utils/scrape/courses";
import type { CourseData, ExtendedInstanceDataConfig } from "~~/functions/src/types/entities";
import type {
	eSIALevel,
	eSIAPlace,
	uSIAFaculty,
	uSIAProgram,
	eSIATypology,
} from "~~/functions/src/types/SIA";
import { getQueryString } from "~~/server/utils/params";
import { Cyrb53 } from "~/utils/firestore";

/**
 * Search for courses by query params
 * Scrape SIA in the background
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async function (event) {
	const scrapedAt = new Date();
	const storage = useStorage("cache");
	const { currentAuth, currentInstanceRef, currentInstance, currentInstanceHost } = event.context;
	const config: ExtendedInstanceDataConfig = currentInstance?.config || {};
	const coursesScrapeRate = config.coursesScrapeRate || 1440; // A day by	default
	const siaMaintenanceTillAt = new Date(config.siaMaintenanceTillAt as Date) || scrapedAt;
	const { debugScrapper } = useRuntimeConfig();
	const Allow = "POST,HEAD";

	/**
	 * Get courses from SIA
	 */
	const getCoursesLinks = defineCachedFunction(
		async (event: ExtendedH3Event, payload: iCoursesPayload) => {
			const { page, cleanup, proxy } = await getPuppeteer(event, debugScrapper);

			try {
				let coursesHandle = await scrapeCoursesHandle(event, page, payload);

				if (payload.typology) {
					// Search by typology if given
					coursesHandle = await scrapeCoursesWithTypologyHandle(event, page, payload);
				}

				// Get courses
				const courseLinks: CourseLink[] = await coursesHandle.evaluate(
					(table, typologies) => {
						const tbody = table?.querySelector("tbody");

						// No courses found
						if (tbody?.tagName !== "TBODY") return [];

						return Array.from(tbody?.children).map((row) => {
							const link = row.children[0].getElementsByTagName("a")[0];
							const code = link.innerHTML;
							const nameSpan = row.children[1].querySelector("span[title]");
							const creditSpan = row.children[2].querySelector("span[title]");
							const typologySpan = row.children[3].querySelector("span[title]");
							const descriptionSpan = row.children[4].querySelector("span[title]");
							const typology = typologySpan?.innerHTML
								? typologies[typologySpan.innerHTML]
								: undefined;

							return {
								code,
								name: nameSpan?.innerHTML || "",
								credits: Number(creditSpan?.innerHTML || 0),
								typology,
								description: descriptionSpan?.innerHTML || "",
							};
						});
					},
					SIATypologies
				);

				await cleanup(); // Cleanup puppeteer

				return courseLinks;
			} catch (err) {
				await cleanup(); // Cleanup puppeteer
				apiLogger(event, "getCoursesLinks", err, { proxy });

				// Prevent caching by throwing error
				throw err;
			}
		},
		{
			name: "getCoursesLinks",
			maxAge: 60 * coursesScrapeRate,
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

		// Level, place, faculty and program are required
		if (!level || !place || !faculty || !program) {
			throw createError({ statusCode: 400, statusMessage: "Missing parameters" });
		}

		let query: Query<CourseData> = currentInstanceRef.collection("courses");

		debugFirebaseServer(event, "api:courses:search", {
			name,
			code,
			level,
			place,
			faculty,
			program,
			typology,
			page,
		});

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		// where code equals (exact match)
		if (code) query = query.where("code", "==", code);
		else if (name) {
			// Search by name instead
			const soundex = soundexEs(getWords(name).join(""));

			if (!soundex) return null;

			query = query.where("level", "==", level); // where level equals
			query = query.where("place", "==", place); // where place equals

			// // where faculty equals, 6 indexes
			// query = query.where(
			// 	Filter.or(
			// 		Filter.where("facultyIndexes.0", "==", faculty),
			// 		Filter.where("facultyIndexes.1", "==", faculty),
			// 		Filter.where("facultyIndexes.2", "==", faculty)
			// 	)
			// );

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

			debugFirebaseServer(event, "api:courses:search:name", { soundex });

			// Get by matching indexes
			query = query.where("indexes", "array-contains", soundex);
			// Order by search relevance then name
			query = query.orderBy("indexesWeights", "desc").orderBy("name");
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

		const coursesRef: CollectionReference<CourseData> =
			currentInstanceRef.collection("courses");
		const payload: iCoursesPayload = { level, place, faculty, program, typology };

		// Check if already scraped
		const cacheValues = [level, place, faculty, program, typology || ""];
		const cacheHash = createHash("sha256").update(cacheValues.join(",")).digest("hex");
		const cacheKey = `nitro:functions:getCoursesLinks:${currentInstanceHost}:${cacheHash}.json`;
		const cachedLinks = await storage.getItem(cacheKey);

		// Fetch course links from SIA if not cached
		// Index courses before returning search
		try {
			if (!currentAuth) {
				apiLogger(event, "api:courses:search", "Scraping courses without authentication");

				throw new Error("Missing auth");
			}

			// Only index if user is authenticated (Prevent abusive calls)
			// Disable if SIA is in maintenance
			if (!cachedLinks && siaMaintenanceTillAt <= scrapedAt) {
				const links = await getCoursesLinks(event, payload);

				// Index scraped courses in parallel
				await Promise.allSettled(
					links.map(async (link) => {
						// Skip if missing identifier data
						if (!link.code || !link.credits || !link.name || !link.typology) return;

						const { typology: linkTypology, ...linkData } = link;
						const id = Cyrb53([link.code]); // Generate deduped course UID
						// Get search indexes
						const { indexes, indexesWeights } = getWeightedSearchIndexes(link.name);

						// Set course
						return coursesRef.doc(String(id)).set(
							{
								...linkData,
								typologies: FieldValue.arrayUnion(linkTypology),
								// From search
								level,
								place,
								programs: FieldValue.arrayUnion(program),
								faculties: FieldValue.arrayUnion(faculty),
								scrapedWith: [level, place, faculty, program, linkTypology],
								// Indexes & createdAt, required for queries
								createdAt: Timestamp.fromDate(scrapedAt),
								indexes,
								indexesWeights,
							},
							{ merge: true }
						);
					})
				);
			}
		} catch (err) {
			// Throw error if not timeout, do not log
			if (err !== "Timed out" && err !== "Missing auth") {
				throw createError({ statusCode: 500, statusMessage: "Scraping failed" });
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
