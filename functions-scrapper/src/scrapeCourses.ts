import { region } from "firebase-functions/v1";
import {
	CollectionReference,
	DocumentReference,
	DocumentSnapshot,
	FieldValue,
	Timestamp,
} from "firebase-admin/firestore";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import { type CourseLink, type iCoursesPayload } from "./types/scrapper.ts";
import { getPuppeteer, retryPuppeteerOperation } from "./utils/puppeteer.ts";
import {
	parseCoursesTable,
	scrapeCoursesHandle,
	scrapeCoursesWithTypologyHandle,
} from "./utils/courses.ts";
import { Cyrb53 } from "./utils/encode.ts";
import { getFirebase } from "./utils/firebase.ts";
import { makeScrapperLogger } from "./utils/logger.ts";

/**
 * Get courses from SIA
 */
async function getCoursesLinks(
	snapshot: DocumentSnapshot,
	payload: iCoursesPayload,
	logger: tLogger,
	debug?: boolean
) {
	const instanceData = snapshot.data();
	const config: Record<string, any> = instanceData?.config || {};
	const { page, cleanup, proxy } = await getPuppeteer(logger, config.pingUrl, debug);
	const { firebaseFirestore } = getFirebase("getCoursesLinks");
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
		logger("getCoursesLinks:SIA", err, { proxy: proxy?.proxy, testDuration });

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

	// Get courses links
	try {
		let coursesHandle = await scrapeCoursesHandle(config, page, payload);

		if (payload.typology) {
			// Search by typology if given
			coursesHandle = await scrapeCoursesWithTypologyHandle(config, page, payload);
		}

		// Get courses
		const courseLinks: CourseLink[] = await parseCoursesTable(coursesHandle);

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

		return courseLinks;
	} catch (err) {
		await cleanup(); // Cleanup puppeteer
		logger("getCoursesLinks", err, { proxy: proxy?.proxy });

		// Prevent caching by throwing error
		throw err;
	}
}

interface iScrapeCoursesPayload {
	instancePath: string;
	payload: iCoursesPayload;
}

/**
 * Scrape courses from SIA
 * Fetch course links from SIA if not cached
 * Index courses before returning search
 */
export const scrapeCourses = region("us-east1")
	.runWith({
		maxInstances: 100,
		memory: "2GB",
		timeoutSeconds: 60 * 9, // 9 minutes
	})
	.https.onRequest(async (req, res): Promise<void> => {
		const { firebaseFirestore } = getFirebase("functions:scrapeCourses");
		const globalLogger = makeScrapperLogger(firebaseFirestore);

		try {
			const scrapedAt = new Date();
			const { instancePath, payload }: iScrapeCoursesPayload = req.body;

			if (req.method?.toUpperCase() !== "POST") throw new Error("Invalid method");
			if (req.headers["content-type"] !== "application/json") {
				throw new Error("Invalid content type");
			}

			if (!instancePath) throw new Error("Missing instance path");

			// Get user ID, if invalid throw error
			const instanceRef: DocumentReference = firebaseFirestore.doc(instancePath);
			const instanceSnapshot = await instanceRef.get();

			if (!instanceSnapshot.exists) throw new Error("Instance not found");

			const instanceData = instanceSnapshot.data();

			const logger = makeScrapperLogger(firebaseFirestore, instanceRef);

			try {
				const config = instanceData?.config || {};
				const siaMaintenanceTillAt =
					new Date(config.siaMaintenanceTillAt as Date) || scrapedAt;
				const { level, place, faculty, program } = payload;

				const coursesRef: CollectionReference = instanceRef.collection("courses");

				// Disable if SIA is in maintenance
				if (siaMaintenanceTillAt > scrapedAt) {
					res.send(false);

					return;
				}

				const links = await getCoursesLinks(instanceSnapshot, payload, logger);

				// Index scraped courses in parallel
				await Promise.allSettled(
					links.map(async (link) => {
						// Skip if missing identifier data
						if (!link.code || !link.credits || !link.name || !link.typology) return;

						const { typology: linkTypology, ...linkData } = link;
						const id = Cyrb53([link.code]); // Generate deduped course UID

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
								// Query requirements
								createdAt: Timestamp.fromDate(scrapedAt),
							},
							{ merge: true }
						);
					})
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
						throw logger("functions:scrapeCourses", "Error scraping courses", err);
				}

				res.send(false);
			}
		} catch (err) {
			globalLogger("functions:scrapeCourses", "Error scraping courses", err);

			res.send(false);
		}
	});
