import { onRequest } from "firebase-functions/https";
import {
	CollectionReference,
	DocumentReference,
	DocumentSnapshot,
	FieldValue,
	Timestamp,
} from "firebase-admin/firestore";

import type { tLogger } from "@open-xamu-co/ui-common-types";
import { makeFunctionsLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import { SIATypologies, type CourseLink, type iCoursesPayload } from "./types/scrapper.js";
import { getPuppeteer, retryPuppeteerOperation } from "./utils/puppeteer.js";
import { scrapeCoursesHandle, scrapeCoursesWithTypologyHandle } from "./utils/courses.js";
import { Cyrb53 } from "./utils/encode.js";

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
		let coursesHandle = await scrapeCoursesHandle(snapshot, page, payload);

		if (payload.typology) {
			// Search by typology if given
			coursesHandle = await scrapeCoursesWithTypologyHandle(snapshot, page, payload);
		}

		// Get courses
		const courseLinks: CourseLink[] = await coursesHandle.evaluate((table, typologies) => {
			const tbody = table?.querySelector("tbody");

			// No courses found
			if (tbody?.tagName !== "TBODY") return [];

			// Some courses could be duplicated (Old SIA thing)
			return Array.from(tbody?.children).reduce<CourseLink[]>((acc, row) => {
				const link = row.children[0].getElementsByTagName("a")[0];
				const code = link.innerHTML;
				const nameSpan = row.children[1].querySelector("span[title]");
				const creditSpan = row.children[2].querySelector("span[title]");
				const typologySpan = row.children[3].querySelector("span[title]");
				const descriptionSpan = row.children[4].querySelector("span[title]");
				// Map to standard typology
				const typology = typologySpan?.innerHTML
					? typologies[typologySpan.innerHTML]
					: undefined;

				const existingIndex = acc.findIndex((course) => course.code === code);

				// Omit if already on array
				if (existingIndex !== -1) return acc;

				return [
					...acc,
					{
						code,
						name: nameSpan?.innerHTML || "",
						credits: Number(creditSpan?.innerHTML || 0),
						typology,
						description: descriptionSpan?.innerHTML || "",
					},
				];
			}, []);
		}, SIATypologies);

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
export const scrapeCourses = onRequest(
	{
		region: "us-east1",
		cors: false,
		maxInstances: 100,
		memory: "2GiB",
		timeoutSeconds: 60 * 10, // 10 minutes
	},
	async (req, res): Promise<void> => {
		const { firebaseFirestore } = getFirebase("functions:scrapeCourses");
		const globalLogger = makeFunctionsLogger(firebaseFirestore);

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

			const logger = makeFunctionsLogger(firebaseFirestore, instanceRef);

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
						throw logger("scrapeCourses", "Error scraping courses", err);
				}

				res.send(false);
			}
		} catch (err) {
			globalLogger("scrapeCourses", "Error scraping courses", err);

			res.send(false);
		}
	}
);
