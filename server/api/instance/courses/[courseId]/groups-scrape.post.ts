import { type DocumentReference } from "firebase-admin/firestore";

import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";
import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";

import type { CourseData } from "~~/functions/src/types/entities";

import type { eSIATypology, uSIAFaculty, uSIAProgram } from "~~/functions/src/types/SIA";
import type { ExtendedH3Event } from "~~/server/types";
import type { iGroupsPayload } from "~~/functions-scrapper/src/types/scrapper";

/**
 * Trigger the course groups scrape cloud function
 */
function makeTriggerCourseGroupsScrape(maxAgeMinutes: number) {
	const { cfScrapeCourseGroupsUrl } = useRuntimeConfig();

	return defineCachedFunction(
		async (event: ExtendedH3Event, { course, ...payload }: iGroupsPayload) => {
			const { currentInstance, currentAuth } = event.context;

			if (!currentInstance || !currentAuth) {
				throw new Error("Missing instance or authorization");
			}

			if (!course.id) throw new Error("Missing course path");

			const response = await $fetch(cfScrapeCourseGroupsUrl, {
				method: "POST",
				credentials: "omit",
				headers: { "Content-Type": "application/json" },
				body: { coursePath: course.id, uid: currentAuth?.uid, payload },
			});

			if (!response) throw new Error("Scraping failed or omitted");

			return { ...payload, course };
		},
		{
			name: "triggerCourseGroupsScrape",
			maxAge: 60 * maxAgeMinutes,
			getKey(event, { course, program, typology }) {
				const { currentInstanceHost } = event.context;
				const baseHash = `${currentInstanceHost}:${getDocumentId(course.id)}:${program}`;

				if (!typology) return baseHash;

				// Compact hash
				return `${baseHash}:${typology}`;
			},
		}
	);
}

/**
 * Get the edges from the logs collection by courseRef
 * Scrape SIA
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth, currentInstanceRef, currentInstance, currentInstanceHost } = event.context;
	const config = currentInstance?.config || {};
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

		if (!currentAuth) {
			throw createError({ statusCode: 401, statusMessage: "Missing authorization" });
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
		const faculty = <uSIAFaculty | undefined>getQueryString("faculty", params);
		const program = <uSIAProgram | undefined>getQueryString("program", params);
		const typology = <eSIATypology | undefined>getQueryString("typology", params);
		const page = getBoolean(params.page);

		// Faculty & program are required
		if (!faculty || !program) {
			throw createError({ statusCode: 400, statusMessage: "Missing faculty or program" });
		}

		debugFirebaseServer(event, "api:courses:logs:courseId:groups-scrape", {
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

		const now = new Date();
		const siaMaintenanceTillAt = new Date((config.siaMaintenanceTillAt as Date) || now);

		// Check if SIA is under maintenance
		if (now < siaMaintenanceTillAt) return false;

		// Get groups from active academic period
		const courseRef = currentInstanceRef.collection("courses").doc(courseId);

		// Check if already scraped
		const storage = useStorage("cache");
		const cacheKayBase = `nitro:functions:getCourseGroupsLinks:${currentInstanceHost}:${getDocumentId(courseRef.id)}:${program}`;
		const cacheKey = typology ? `${cacheKayBase}:${typology}.json` : `${cacheKayBase}.json`;
		const cacheDuration = config.coursesRefreshRate ?? 2;
		const cachedGroups = await storage.getItem(cacheKey);

		if (cachedGroups) return true;

		const triggerCourseGroupsScrape = makeTriggerCourseGroupsScrape(cacheDuration);

		// Index groups before resolving query
		// TODO: use a count aggregator to prevent awaiting the scrape, and scrape in the background
		await triggerCourseGroupsScrape(event, {
			course: { id: courseRef.path },
			faculty,
			program,
			typology,
		});

		return true;
	} catch (err) {
		apiLogger(event, "api:instance:courses:courseId:groups-scrape", err, {
			courseRef: courseRef?.path,
		});

		return false;
	}
});
