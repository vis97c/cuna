import type { CollectionReference, DocumentReference, Query } from "firebase-admin/firestore";

import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { defineConditionallyCachedEventHandler } from "@open-xamu-co/firebase-nuxt/server/cache";
import { getBoolean } from "@open-xamu-co/firebase-nuxt/server/guards";
import {
	debugFirebaseServer,
	getEdgesPage,
	getOrderedQuery,
	getQueryAsEdges,
} from "@open-xamu-co/firebase-nuxt/server/firestore";

import type { CourseData, GroupData } from "~~/functions/src/types/entities";
import sumBy from "lodash-es/sumBy";

/**
 * Get the edges from the logs collection by courseRef
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentAuth, currentInstanceRef } = event.context;
	const Allow = "GET,HEAD";
	const scrapedAt = new Date();

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

		// Get groups from active academic period
		const courseRef: DocumentReference<CourseData> = currentInstanceRef
			.collection("courses")
			.doc(courseId);
		let query: Query<GroupData> = courseRef
			.collection("groups")
			.where("periodEndAt", ">=", thresholdDate);

		// Order at last
		query = getOrderedQuery(event, query);

		// Require auth for scraping
		if (currentAuth) {
			const groupsRef: CollectionReference<GroupData> = courseRef.collection("groups");

			// Fetch from SIA, do not await
			getCourseGroups(event, courseRef).then(async (groups) => {
				const groupCount = groups.length;
				const spotsCount = sumBy(groups, "availableSpots");

				// Index scraped groups (await before updating course)
				await Promise.all(
					groups.map((group) => {
						// Skip if missing identifier data
						if (!group.periodEndAt || !group.name) return;

						const periodEndAt = group.periodEndAt as unknown as Date;
						// Generate deduped course UID
						const id = Cyrb53([group.name, String(periodEndAt.getTime())]);

						return groupsRef
							.doc(String(id))
							.set({ ...group, scrapedAt }, { merge: true });
					})
				);

				// Update course group count, do not await
				courseRef.update({ groupCount, spotsCount });
			});
		}

		if (page) return getEdgesPage(event, query);

		// Page limit. Prevent abusive callings (>100)
		const first = Math.min(Number(params.first) || 10, 100);

		return getQueryAsEdges(event, query.limit(first));
	} catch (err) {
		apiLogger(event, "api:courses:logs:courseId", err);

		throw err;
	}
});
