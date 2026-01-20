import type { ElementHandle, Page } from "puppeteer";
import { DocumentReference } from "firebase-admin/firestore";

import { TimedPromise } from "@open-xamu-co/firebase-nuxt/server/guards";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";

import type { CourseData, tWeeklySchedule } from "~~/functions/src/types/entities";

import { getPuppeteer, type CourseGroupLink, type ExtendedH3Event } from "./utils";
import {
	scrapeCoursesHandle,
	scrapeCoursesWithTypologyHandle,
	type iCoursesPayload,
} from "./courses";

/**
 * Get HTML element ids from a table handle
 * @param handle Table handle
 * @returns Object with course codes as keys and HTML ids as values
 */
function getHTMLElementIds(handle: ElementHandle<Element>) {
	return handle.evaluate((table) => {
		const tbody = table?.querySelector("tbody");

		// No courses found
		if (tbody?.tagName !== "TBODY") return {};

		const rows = tbody?.children;

		// { code: HTMLId }
		return Array.from(rows).reduce<Record<string, string>>((acc, row) => {
			const link = row.children[0].getElementsByTagName("a")[0];

			return { ...acc, [link.innerHTML]: link.id };
		}, {});
	});
}

/**
 * Navigate the SIA to get to the course groups
 *
 * Assume scrapedWith is valid
 */
export async function scrapeCourseGroupsLinks(
	event: ExtendedH3Event,
	page: Page,
	course: CourseData
): Promise<{ links: CourseGroupLink[]; errors: Error[] }> {
	const [level, place, faculty, program, typology] = course.scrapedWith || [];

	// Course data is required
	if (!course.code || !level || !place || !faculty || !program) {
		throw new Error("Missing course data");
	}

	const payload: iCoursesPayload = { level, place, faculty, program, typology };
	// Get handle without typology
	let handle: ElementHandle<Element> = await scrapeCoursesHandle(event, page, payload);
	let ids: Record<string, string> = await getHTMLElementIds(handle);
	let courseHTMLId: string | undefined = ids[course.code];

	// No match found, attempt with typology
	if (!courseHTMLId && typology) {
		handle = await scrapeCoursesWithTypologyHandle(event, page, payload);
		ids = await getHTMLElementIds(handle);
		courseHTMLId = ids[course.code];
	}

	if (!courseHTMLId) throw new Error("Course not found");

	debugFirebaseServer(event, "getCourseGroupsLinks", courseHTMLId);

	return TimedPromise<{ links: CourseGroupLink[]; errors: Error[] }>(
		async function (resolve, _reject) {
			// Navigate to course
			await page.click(useHTMLElementId(courseHTMLId));
			await page.waitForNetworkIdle();

			const response = await page.evaluate(() => {
				const trimHTML = (el?: Element | null) => (el ? el.innerHTML.trim() : "");
				const activityH3 = document.querySelector("span[id$=w-titulo] h3");
				const activity = trimHTML(activityH3) || "Desconocida";
				const linkElements = document.querySelectorAll("span[id$=pgl14]");
				const errors: Error[] = [];

				// Map groups
				const links: CourseGroupLink[] = Array.from(linkElements).map((root) => {
					const startDateSpan = root.querySelector("span[id$=ot12]");
					const endDateSpan = root.querySelector("span[id$=ot14]");
					const teacherSpan = root.querySelector("span[id$=ot8]");
					const spotsSpan = root.querySelector("span[id$=ot24]");
					const spots: number = Number(trimHTML(spotsSpan)) || 0;
					const nameH2 = root.querySelector("h2.af_showDetailHeader_title-text0");
					const fullName = trimHTML(nameH2) || "(0) No reportado";
					const nameStartAt = fullName.indexOf(")");
					const schedule: tWeeklySchedule = ["", "", "", "", "", "", ""];
					let classrooms: string[] = [];

					// Map schedule & classrooms
					Array.from(root.querySelectorAll("span[id$=pgl10]")).forEach(
						(scheduledSpace) => {
							const classroomSpan = scheduledSpace.lastElementChild?.children[1];
							const scheduleSpan = scheduledSpace?.firstElementChild;
							const [day, unparsedSpan] = trimHTML(scheduleSpan)
								.toLowerCase()
								.split(" de ");

							if (!day || !unparsedSpan) {
								return errors.push(new Error("Non supported schedule format"));
							}

							const span = unparsedSpan.replaceAll(".", "").split(" a ").join("|");

							classrooms = [
								...new Set([
									...classrooms,
									trimHTML(classroomSpan).replaceAll(".", "") || "Sin Asignar",
								]),
							];

							switch (day) {
								case "lunes":
									schedule[0] = span;
									break;
								case "martes":
									schedule[1] = span;
									break;
								case "miercoles":
								case "miércoles":
									schedule[2] = span;
									break;
								case "jueves":
									schedule[3] = span;
									break;
								case "viernes":
									schedule[4] = span;
									break;
								case "sabado":
								case "sábado":
									schedule[5] = span;
									break;
								case "domingo":
									schedule[6] = span;
									break;
							}
						}
					);

					const teacher = trimHTML(teacherSpan).replaceAll(".", "").toLowerCase();

					return {
						spots,
						activity,
						availableSpots: spots,
						schedule,
						classrooms,
						name: fullName.substring(nameStartAt + 2),
						teachers: [teacher || "No Informado"],
						// Nuxt serializable string date
						periodStartAt: trimHTML(startDateSpan),
						periodEndAt: trimHTML(endDateSpan),
					};
				});

				return { links, errors };
			});

			resolve(response);
		},
		{ timeout: 1000 * 60 * 2 }
	);
}

/**
 * Get courses from SIA course
 *
 * @cache 2 minutes
 */
export const getCourseGroupsLinks = defineCachedFunction(
	async (event: ExtendedH3Event, courseRef: DocumentReference<CourseData>) => {
		const { browser, page } = await getPuppeteer();

		try {
			const snapshot = await courseRef.get();
			const course = snapshot.data();

			if (!course) throw new Error("Course not found");

			// Get groups data
			const { links, errors } = await scrapeCourseGroupsLinks(event, page, course);

			browser.close(); // Cleanup, do not await

			// Log errors if any, do not await
			errors.forEach((err) => apiLogger(event, `api:courses:[${courseRef.id}]:groups`, err));

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
		maxAge: 60 * 2, // 2 minutes
		getKey(event, courseRef) {
			const { currentInstanceHost } = event.context;

			// Compact hash
			return `${currentInstanceHost}:${getDocumentId(courseRef.id)}`;
		},
	}
);
