import type { ElementHandle, Page } from "puppeteer-core";

import { TimedPromise } from "@open-xamu-co/firebase-nuxt/server/guards";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";

import type { CourseData, tWeeklySchedule } from "~~/functions/src/types/entities";

import type { CourseGroupLink, ExtendedH3Event } from "./utils";
import type { iCoursesPayload } from "./courses";
import type { eSIATypology, uSIAProgram } from "~~/functions/src/types/SIA";

interface HTMLCourse {
	id: string;
	code: string;
	typology?: eSIATypology;
}

/**
 * Get HTML element ids from a table handle
 * @param handle Table handle
 * @returns Object with course codes as keys and HTML ids as values
 */
function getHTMLElementIds(handle: ElementHandle<Element>) {
	return handle.evaluate((table, typologies) => {
		const tbody = table?.querySelector("tbody");

		// No courses found
		if (tbody?.tagName !== "TBODY") return {};

		const rows = tbody?.children;

		// Reduce courses data
		return Array.from(rows).reduce<Record<string, HTMLCourse>>((acc, row) => {
			const link = row.children[0].getElementsByTagName("a")[0];
			const typologySpan = row.children[3].querySelector("span[title]");
			// Map to standard typology
			const typology = typologySpan?.innerHTML
				? typologies[typologySpan.innerHTML]
				: undefined;

			return {
				...acc,
				[link.innerHTML]: {
					code: link.innerHTML,
					id: link.id,
					typology,
				},
			};
		}, {});
	}, SIATypologies);
}

/**
 * Group scrape dynamic payload
 * Different programs could offer different groups for the same course
 * Different typologies could offer different groups for the same course
 */
export interface iGroupsPayload {
	program: uSIAProgram;
	typology?: eSIATypology;
}

/**
 * Navigate the SIA to get to the course groups
 *
 * Assume scrapedWith is valid
 */
export async function scrapeCourseGroupsLinks(
	event: ExtendedH3Event,
	page: Page,
	course: CourseData,
	{ program, typology }: iGroupsPayload
): Promise<{ links: CourseGroupLink[]; errors: Error[] }> {
	const { currentInstance } = event.context;
	const { siaOldURL = "" } = currentInstance?.config || {};

	// SIA navigation is required beforehand
	if (!page.url().includes(siaOldURL)) throw new Error("Page is not the SIA");

	const [level, place, faculty] = course.scrapedWith || [];

	// Course data is required
	if (!course.code || !level || !place || !faculty || !program) {
		throw new Error("Missing course data");
	}

	const payload: iCoursesPayload = { level, place, faculty, program, typology };
	// Get handle without typology
	let handle: ElementHandle<Element> = await scrapeCoursesHandle(event, page, payload);
	let courses = await getHTMLElementIds(handle);
	let courseHTML: HTMLCourse | undefined = courses[course.code];

	// No match found, attempt with typology
	if (!courseHTML && typology) {
		handle = await scrapeCoursesWithTypologyHandle(event, page, payload);
		courses = await getHTMLElementIds(handle);
		courseHTML = courses[course.code];
	}

	if (!courseHTML.typology) throw new Error("Course not found in SIA");

	debugFirebaseServer(event, "getCourseGroupsLinks", courseHTML);

	return TimedPromise<{ links: CourseGroupLink[]; errors: Error[] }>(
		async function (resolve, _reject) {
			// Navigate to course
			await page.click(useHTMLElementId(courseHTML.id));
			await page.waitForNetworkIdle();

			const response = await page.evaluate((courseTypology) => {
				// Bypass if no typology (should not happen)
				if (!courseTypology) {
					return { links: [], errors: [new Error("No typology provided")] };
				}

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
						typology: courseTypology,
						// Nuxt serializable string date
						periodStartAt: trimHTML(startDateSpan),
						periodEndAt: trimHTML(endDateSpan),
					};
				});

				return { links, errors };
			}, courseHTML.typology);

			resolve(response);
		},
		{
			timeout: 1000 * 30, // 30 seconds timeout
		}
	);
}
