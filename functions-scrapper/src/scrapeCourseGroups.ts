import {
	CollectionReference,
	FieldValue,
	Firestore,
	Timestamp,
	WriteResult,
	type DocumentReference,
	type DocumentSnapshot,
} from "firebase-admin/firestore";
import { region } from "firebase-functions/v1";
import sumBy from "lodash-es/sumBy.js";
import deburr from "lodash-es/deburr.js";
import startCase from "lodash-es/startCase.js";

import type { tLogger } from "@open-xamu-co/ui-common-types";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { makeFunctionsLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";

import type { iGroupsPayload } from "./types/scrapper.js";
import { getPuppeteer, retryPuppeteerOperation } from "./utils/puppeteer.js";
import { Cyrb53 } from "./utils/encode.js";
import { scrapeCourseGroupsLinks } from "./utils/groups.js";

interface CourseDataRef {
	[x: string]: any;
	groupCount: number | FieldValue;
	spotsCount: number | FieldValue;
	scrapedAt: Timestamp | FieldValue;
	programs: string[] | FieldValue;
	faculties: string[] | FieldValue;
	typologies?: string[] | FieldValue;
}

/**
 * Scrape the course groups links from SIA
 */
async function getCourseGroupsLinks(
	firebaseFirestore: Firestore,
	snapshot: DocumentSnapshot,
	payload: iGroupsPayload,
	logger: tLogger,
	debug?: boolean
) {
	const instanceData = snapshot.data();
	const config: Record<string, any> = instanceData?.config || {};
	const { page, cleanup, proxy } = await getPuppeteer(logger, config.pingUrl, debug);
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
		logger("getCourseGroupsLinks:SIA", err, { proxy: proxy?.proxy, testDuration });

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

	// Get groups data
	try {
		const { links, errors } = await scrapeCourseGroupsLinks(snapshot, page, payload);

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
			logger(`api:courses:[${payload.course.id}]:groups`, err, { proxy: proxy?.proxy })
		);

		return links;
	} catch (err) {
		await cleanup(); // Cleanup puppeteer
		logger(`api:courses:[${payload.course.id}]:groups`, err, { proxy: proxy?.proxy });

		// Prevent caching by throwing error
		throw err;
	}
}

interface iScrapeCourseGroupsPayload {
	coursePath: string;
	payload: Omit<iGroupsPayload, "course">;
}

/**
 * Scrape the course groups from SIA
 * TODO: scrape course prerequisites
 *
 */
export const scrapeCourseGroups = region("us-east1")
	.runWith({
		maxInstances: 100,
		memory: "2GB",
		timeoutSeconds: 60 * 9, // 9 minutes
	})
	.https.onRequest(async (req, res): Promise<void> => {
		const { firebaseFirestore } = getFirebase("functions:scrapeCourseGroups");
		const globalLogger = makeFunctionsLogger(firebaseFirestore);

		try {
			const scrapedAt = new Date();
			const { coursePath, payload }: iScrapeCourseGroupsPayload = req.body;

			if (req.method?.toUpperCase() !== "POST") throw new Error("Invalid method");
			if (req.headers["content-type"] !== "application/json") {
				throw new Error("Invalid content type");
			}

			if (!coursePath) throw new Error("Missing course path");

			// Get user ID, if invalid throw error
			const courseRef: DocumentReference = firebaseFirestore.doc(coursePath);
			const instanceRef: DocumentReference | null = courseRef.parent.parent;
			const instanceSnapshot = await instanceRef?.get();

			if (!instanceRef || !instanceSnapshot?.exists) throw new Error("Instance not found");

			const instanceData = instanceSnapshot.data();
			const logger = makeFunctionsLogger(firebaseFirestore, instanceRef);

			try {
				const config = instanceData?.config || {};
				const siaMaintenanceTillAt =
					new Date(config.siaMaintenanceTillAt as Date) || scrapedAt;
				const { faculty, program } = payload;

				const groupsRef: CollectionReference = courseRef.collection("groups");
				const teachersRef: CollectionReference = instanceRef.collection("teachers");

				// Disable if SIA is in maintenance
				if (siaMaintenanceTillAt > scrapedAt) {
					res.send(false);

					return;
				}

				const snapshot = await courseRef.get();
				const course = snapshot.data();
				const { name: courseName, code: courseCode } = course || {};

				if (!course) throw new Error("Course not found");

				const links = await getCourseGroupsLinks(
					firebaseFirestore,
					instanceSnapshot,
					{ ...payload, course },
					logger
				);

				// Bypass if no links found
				if (!links.length) {
					res.send(false);

					return;
				}

				const [sampleLink] = links;
				const groupCount = links.length;
				const spotsCount = sumBy(links, "availableSpots");
				const newCourseData: CourseDataRef = {
					groupCount,
					spotsCount,
					scrapedAt: Timestamp.fromDate(scrapedAt),
					// Improve indexation
					programs: FieldValue.arrayUnion(program),
					faculties: FieldValue.arrayUnion(faculty),
					typologies: FieldValue.arrayUnion(sampleLink.typology),
				};

				// Update course data, do not await
				courseRef?.update(newCourseData);

				// Index scraped groups in parallel
				await Promise.allSettled(
					links.reduce<Promise<WriteResult>[]>((acc, { teachers = [], ...group }) => {
						// Skip if missing identifier data
						if (!group.periodStartAt || !group.periodEndAt || !group.name) return acc;

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
								{ name, coursesRefs: FieldValue.arrayUnion(courseRef) },
								{ merge: true }
							);

							return teacherRef;
						});

						// Set group, createdAt is required for queries
						return [
							...acc,
							groupRef.set(
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
									// typology, already on group
								},
								{ merge: true }
							),
						];
					}, [])
				);

				res.send(true);
			} catch (err) {
				// Throw error if not timeout, do not log
				switch (err) {
					case "Missing auth":
					case "Timed out": // Scraping timed out
					case "Unreachable": // Unable to connect within timeout
						// Do not throw
						break;
					default:
						throw logger(
							"functions:scrapeCourseGroups",
							"Error scraping course groups",
							err
						);
				}

				res.send(false);
			}
		} catch (err) {
			globalLogger("functions:scrapeCourseGroups", "Error scraping course groups", err);

			res.send(false);
		}
	});
