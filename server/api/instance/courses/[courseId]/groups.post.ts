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

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const scrapedAt = new Date();
	const storage = useStorage("cache");
	const { currentAuth, currentInstanceRef, currentInstance, currentInstanceHost } = event.context;
	const {
		coursesRefreshRate = 2, // 2 minutes by default
		siaMaintenanceTillAt = scrapedAt,
	}: ExtendedInstanceDataConfig = currentInstance?.config || {};
	const { debugScrapper } = useRuntimeConfig();
	const Allow = "POST,HEAD";
	let courseRef: DocumentReference<CourseData> | undefined;

	/**
	 * Scrape the course groups links from SIA
	 */
	const getCourseGroupsLinks = defineCachedFunction(
		async (event: ExtendedH3Event, courseRef: DocumentReference<CourseData>) => {
			const { browser, page } = await getPuppeteer(event, debugScrapper);

			try {
				const snapshot = await courseRef.get();
				const course = snapshot.data();

				if (!course) throw new Error("Course not found");

				// Get groups data
				const { links, errors } = await scrapeCourseGroupsLinks(event, page, course);

				browser.close(); // Cleanup, do not await

				// Log errors if any, do not await
				errors.forEach((err) =>
					apiLogger(event, `api:courses:[${courseRef.id}]:groups`, err)
				);

				return links;
			} catch (error) {
				browser.close(); // Cleanup, do not await
				apiLogger(event, `api:courses:[${courseRef.id}]:groups`, error);

				// Prevent caching by throwing error
				throw error;
			}
		},
		{
			name: "getCourseGroupsLinks",
			maxAge: 60 * coursesRefreshRate,
			getKey(event, courseRef) {
				const { currentInstanceHost } = event.context;

				// Compact hash
				return `${currentInstanceHost}:${getDocumentId(courseRef.id)}`;
			},
		}
	);

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

		const courseId = getRouterParam(event, "courseId");
		const params = getQuery(event);
		const page = getBoolean(params.page);

		debugFirebaseServer(event, "api:courses:logs:courseId", courseId, params);

		if (!courseId) {
			throw createError({ statusCode: 400, statusMessage: `courseId is required` });
		}

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
		const teachersRef: CollectionReference<TeacherData> =
			currentInstanceRef.collection("teachers");
		let query: Query<GroupData> = groupsRef.where("periodEndAt", ">=", thresholdTimestamp);

		// Check if already scraped
		const cacheKey = `nitro:functions:getCourseGroupsLinks:${currentInstanceHost}:${courseId}.json`;
		const cachedGroups = await storage.getItem(cacheKey);

		// Fetch from SIA if not cached
		// Index groups before resolving query
		// TODO: scrape course prerequisites
		try {
			// Only index if user is authenticated (Prevent abusive calls)
			// Disable if SIA is in maintenance
			if (!cachedGroups && currentAuth && siaMaintenanceTillAt <= scrapedAt) {
				const links = await getCourseGroupsLinks(event, courseRef);
				const groupCount = links.length;
				const spotsCount = sumBy(links, "availableSpots");
				const { name: courseName, code: courseCode } =
					(await courseRef.get())?.data() || {};

				// Index scraped groups (await before updating course)
				await Promise.all(
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
						const id = Cyrb53([group.name, String(periodEndAt.getTime())]);
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
									// CreatedAt, required for queries
									createdAt: Timestamp.fromDate(scrapedAt),
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
								createdAt: Timestamp.fromDate(scrapedAt),
								periodStartAt,
								periodEndAt,
							},
							{ merge: true }
						);
					})
				);

				// Update course group count, do not await
				courseRef?.update({
					groupCount,
					spotsCount,
					scrapedAt: Timestamp.fromDate(scrapedAt),
				});
			}
		} catch (err) {
			// Throw error if not timeout, do not log
			if (err !== "Timed out") {
				throw createError({ statusCode: 500, statusMessage: "Scraping failed" });
			}
		}

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
