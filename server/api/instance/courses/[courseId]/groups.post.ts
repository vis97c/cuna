import {
	FieldValue,
	Timestamp,
	type CollectionReference,
	type DocumentReference,
	type Query,
} from "firebase-admin/firestore";
import sumBy from "lodash-es/sumBy";
import deburr from "lodash-es/deburr";
import startCase from "lodash-es/startCase";

import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";

import type {
	CourseData,
	ExtendedInstanceDataConfig,
	GroupData,
	TeacherData,
} from "~~/functions/src/types/entities";
import { Cyrb53 } from "~/utils/firestore";
import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import type { eSIATypology, uSIAProgram } from "~~/functions/src/types/SIA";
import type { iGroupsPayload } from "~~/server/utils/scrape/groups";

/**
 * Scrape the course groups links from SIA
 */
function makeGetCourseGroupsLinks(maxAgeMinutes: number, debug?: boolean) {
	return defineCachedFunction(
		async (
			event: ExtendedH3Event,
			courseRef: DocumentReference<CourseData>,
			payload: iGroupsPayload
		) => {
			const { page, cleanup, proxy } = await getPuppeteer(event, debug);
			const { firebaseFirestore } = getFirebase("getCourseGroupsLinks");
			const { currentInstance } = event.context;
			const config: ExtendedInstanceDataConfig = currentInstance?.config || {};
			const siaOldURL = config.siaOldURL || "";
			const siaOldPath = config.siaOldPath || "";
			const siaOldQuery = config.siaOldQuery || "";
			const siaOldEnpoint = siaOldURL + siaOldPath + siaOldQuery;
			const testStartAt = new Date();

			try {
				// Navigate to SIA, in less than 60 seconds
				// Public proxies could easily throw network errors
				const response = await retryPuppeteerOperation(() => {
					return page.goto(siaOldEnpoint, { timeout: 1000 * 60 });
				});

				if (!response?.ok) throw new Error("Unable to reach SIA");
			} catch (err) {
				// Error! Get test duration in seconds
				const testEndAt = new Date();
				const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

				// Report proxy error
				debugFirebaseServer(event, "getCourseGroupsLinks:SIA", {
					proxy: proxy?.proxy,
					testDuration,
				});
				apiLogger(event, "getCourseGroupsLinks:SIA", err, {
					proxy: proxy?.proxy,
					testDuration,
				});

				if (proxy) {
					// Update proxy score, do not await
					firebaseFirestore.doc(proxy.path).update({
						timesDead: FieldValue.increment(1),
						timeout: testDuration,
					});
				}

				await cleanup(); // Cleanup puppeteer

				// Timed out errors are not logged
				throw new Error("Unreachable");
			}

			// Get course data
			try {
				const snapshot = await courseRef.get();
				const course = snapshot.data();

				if (!course) throw new Error("Course not found");

				// Get groups data
				const { links, errors } = await scrapeCourseGroupsLinks(
					event,
					page,
					course,
					payload
				);

				if (proxy) {
					// Success! Get session duration in seconds
					const sessionEndAt = new Date();
					const sessionDuration = (sessionEndAt.getTime() - testStartAt.getTime()) / 1000;

					// Update proxy score, do not await
					firebaseFirestore.doc(proxy.path).update({
						sessionTimeout: sessionDuration,
					});
				}

				await cleanup(); // Cleanup puppeteer

				// Log errors if any, do not await
				errors.forEach((err) =>
					apiLogger(event, `api:courses:[${courseRef.id}]:groups`, err, {
						proxy: proxy?.proxy,
					})
				);

				return links;
			} catch (err) {
				await cleanup(); // Cleanup puppeteer
				apiLogger(event, `api:courses:[${courseRef.id}]:groups`, err, {
					proxy: proxy?.proxy,
				});

				// Prevent caching by throwing error
				throw err;
			}
		},
		{
			name: "getCourseGroupsLinks",
			maxAge: 60 * maxAgeMinutes,
			getKey(event, courseRef, { program, typology }) {
				const { currentInstanceHost } = event.context;
				const baseHash = `${currentInstanceHost}:${getDocumentId(courseRef.id)}:${program}`;

				if (!typology) return baseHash;

				// Compact hash
				return `${baseHash}:${typology}`;
			},
		}
	);
}

/**
 * Scrape the course groups from SIA
 * TODO: scrape course prerequisites
 *
 * @param event The event
 * @param courseRef The course reference
 * @param payload The payload
 * @param debug Whether to debug
 */
async function scrapeCourseGroupsFromSIA(
	event: ExtendedH3Event,
	courseRef: DocumentReference<CourseData>,
	payload: iGroupsPayload,
	debug?: boolean
) {
	const scrapedAt = new Date();
	const { currentAuth, currentInstance, currentInstanceRef, currentInstanceHost } = event.context;
	const config: ExtendedInstanceDataConfig = currentInstance?.config || {};
	const siaMaintenanceTillAt = new Date(config.siaMaintenanceTillAt as Date) || scrapedAt;
	const { program, typology } = payload;

	try {
		// Check if already scraped
		const storage = useStorage("cache");
		const cacheKayBase = `nitro:functions:getCourseGroupsLinks:${currentInstanceHost}:${getDocumentId(courseRef.path)}:${program}`;
		const cacheKey = typology ? `${cacheKayBase}:${typology}.json` : `${cacheKayBase}.json`;
		const cachedGroups = await storage.getItem(cacheKey);

		if (!currentAuth || !currentInstanceRef) {
			apiLogger(event, "api:courses:groups", "Scraping groups without authentication");

			throw new Error("Missing auth");
		}

		const groupsRef: CollectionReference<GroupData> = courseRef.collection("groups");
		const teachersRef: CollectionReference<TeacherData> =
			currentInstanceRef.collection("teachers");

		// Only index if user is authenticated (Prevent abusive calls)
		// Disable if SIA is in maintenance
		if (!cachedGroups && siaMaintenanceTillAt <= scrapedAt) {
			// Cache for 2 minutes by default
			const getCourseGroupsLinks = makeGetCourseGroupsLinks(
				config.coursesRefreshRate ?? 2,
				debug
			);
			const links = await getCourseGroupsLinks(event, courseRef, payload);
			const groupCount = links.length;
			const spotsCount = sumBy(links, "availableSpots");
			const { name: courseName, code: courseCode } = (await courseRef.get())?.data() || {};

			// Update course group count, do not await
			courseRef?.update({
				groupCount,
				spotsCount,
				scrapedAt: Timestamp.fromDate(scrapedAt),
			});

			// Index scraped groups in parallel
			await Promise.allSettled(
				links.map(async ({ teachers = [], ...group }) => {
					// Skip if missing identifier data
					if (!group.periodStartAt || !group.periodEndAt || !group.name) return;

					// Get date from string (dd/mm/yyyy)
					const [startDay, startMonth, startYear] = (group.periodStartAt as any)
						.split("/")
						.map(Number);
					const [endDay, endMonth, endYear] = (group.periodEndAt as any)
						.split("/")
						.map(Number);
					// Build date objects
					const periodStartAt = new Date(startYear, startMonth - 1, startDay);
					const periodEndAt = new Date(endYear, endMonth - 1, endDay);
					// Generate deduped course UID
					// Differentiated by program and typology
					const id = Cyrb53([
						group.name,
						String(periodEndAt.getTime()),
						program,
						group.typology,
					]);
					const groupRef = groupsRef.doc(String(id));

					// Index teachers
					const teachersRefs = teachers.map((teacher) => {
						// Generate deduped teacher UID
						const teacherId = Cyrb53([deburr(teacher)]);
						const teacherRef = teachersRef.doc(String(teacherId));
						const name = startCase(teacher.toLowerCase());

						// Set teacher, do not await
						teacherRef.set(
							{
								name,
								coursesRefs: FieldValue.arrayUnion(courseRef),
							},
							{ merge: true }
						);

						return teacherRef;
					});

					// Set group, createdAt is required for queries
					return groupRef.set(
						{
							...group,
							courseName,
							courseCode,
							teachersRefs: FieldValue.arrayUnion(...teachersRefs),
							scrapedAt: Timestamp.fromDate(scrapedAt),
							periodStartAt,
							periodEndAt,
							// Query requirements
							createdAt: Timestamp.fromDate(scrapedAt),
							// Group variables
							program,
							typology,
						},
						{ merge: true }
					);
				})
			);
		}
	} catch (err) {
		// Throw error if not timeout, do not log
		switch (err) {
			case "Missing auth":
			case "Timed out": // Scraping timed out
			case "Unreachable": // Unable to connect within timeout
				// Do not throw
				break;
			default:
				throw createError({ statusCode: 500, statusMessage: "Group scraping failed" });
		}
	}
}

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentInstanceRef } = event.context;
	const { debugScrapper } = useRuntimeConfig();
	const Allow = "POST,HEAD";
	let courseRef: DocumentReference<CourseData> | undefined;

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

		const courseId = getRouterParam(event, "courseId");

		if (!courseId) {
			throw createError({ statusCode: 400, statusMessage: `courseId is required` });
		}

		const params = getQuery(event);
		const program = <uSIAProgram | undefined>getQueryString("program", params);
		const typology = <eSIATypology | undefined>getQueryString("typology", params);
		const page = getBoolean(params.page);

		// Program is required
		if (!program) throw createError({ statusCode: 400, statusMessage: "Missing program" });

		debugFirebaseServer(event, "api:courses:logs:courseId", {
			courseId,
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

		/** Academic period threshold */
		const thresholdDate = new Date();

		// Set threshold of academic period to current date minus a month
		// This should return groups even a month after the period ended
		thresholdDate.setMonth(thresholdDate.getMonth() - 1);

		const thresholdTimestamp = Timestamp.fromDate(thresholdDate);

		// Get groups from active academic period
		const courseRef = currentInstanceRef.collection("courses").doc(courseId);
		const groupsRef: CollectionReference<GroupData> = courseRef.collection("groups");
		let query: Query<GroupData> = groupsRef
			.where("periodEndAt", ">=", thresholdTimestamp)
			.where("program", "==", program);

		// Filter by typology
		if (typology) query = query.where("typology", "==", typology);

		// Index groups before resolving query
		// TODO: use a count aggregator to prevent awaiting the scrape, and scrape in the background
		scrapeCourseGroupsFromSIA(event, courseRef, { program, typology }, debugScrapper);

		// Order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:instance:courses:courseId:groups", err, {
			courseRef: courseRef?.path,
		});

		throw err;
	}
});
