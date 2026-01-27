import type { ElementHandle, Page } from "puppeteer-core";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { TimedPromise } from "@open-xamu-co/firebase-nuxt/server/guards";

import { eHTMLElementIds, SIALEPrograms, type iCoursesPayload } from "../types/scrapper.js";
import { getHTMLElementOptions, useHTMLElementId, waitForSelect } from "./puppeteer.js";

/**
 * Get to the courses list from sia
 */
export async function scrapeCoursesHandle(
	snapshot: DocumentSnapshot,
	page: Page,
	payload: iCoursesPayload
): Promise<ElementHandle<Element>> {
	const { siaOldURL = "", siaOldLevel, siaOldPlace } = snapshot.data()?.config || {};

	// SIA navigation is required beforehand
	if (!page.url().includes(siaOldURL)) throw new Error("Page is not the SIA");

	return TimedPromise<ElementHandle<Element>>(
		async function (resolve, reject) {
			if (!siaOldLevel?.[payload.level] || !siaOldPlace?.[payload.place]) {
				throw reject("Missing place or level lists");
			}

			await page.evaluate(() => {
				// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
				if (document.querySelector("#d1")?.clientHeight === 1) {
					throw new Error("There was an error loading the page");
				}
			});

			await page.waitForSelector(useHTMLElementId(eHTMLElementIds.LEVEL), { visible: true });

			// Select level
			await page.click(useHTMLElementId(eHTMLElementIds.LEVEL));
			await page.select(useHTMLElementId(eHTMLElementIds.LEVEL), siaOldLevel[payload.level]);
			await waitForSelect(page, eHTMLElementIds.PLACE);

			// Select Place
			await page.click(useHTMLElementId(eHTMLElementIds.PLACE));
			await page.select(useHTMLElementId(eHTMLElementIds.PLACE), siaOldPlace[payload.place]);
			await waitForSelect(page, eHTMLElementIds.FACULTY);

			// Get faculty options
			const facultyOptions = await getHTMLElementOptions(page, eHTMLElementIds.FACULTY);
			const facultyValue = facultyOptions.find(({ alias }) => payload.faculty === alias);

			if (!facultyValue) throw reject(`No faculty found for ${payload.faculty}`);

			// Select Faculty
			await page.click(useHTMLElementId(eHTMLElementIds.FACULTY));
			await page.select(useHTMLElementId(eHTMLElementIds.FACULTY), facultyValue.value);
			await waitForSelect(page, eHTMLElementIds.PROGRAM);

			// Get program options
			const programOptions = await getHTMLElementOptions(page, eHTMLElementIds.PROGRAM);
			const programValue = programOptions.find(({ alias }) => payload.program === alias);

			if (!programValue) throw reject(`No program found for ${payload.program}`);

			// Select Program
			await page.click(useHTMLElementId(eHTMLElementIds.PROGRAM));
			await page.select(useHTMLElementId(eHTMLElementIds.PROGRAM), programValue.value);
			await waitForSelect(page, eHTMLElementIds.TYPOLOGY);

			// Load courses (click show button)
			await page.waitForSelector(
				`${useHTMLElementId(eHTMLElementIds.SHOW)}:not(.p_AFDisabled)`
			);
			await page.click(useHTMLElementId(eHTMLElementIds.SHOW));

			// Check courses table if not already loaded
			const handle: ElementHandle<Element> | null = await page.waitForSelector(
				useHTMLElementId(eHTMLElementIds.TABLE),
				{ visible: true }
			);

			if (!handle) throw reject("Missing courses table");

			resolve(handle);
		},
		{
			timeout: 1000 * 30, // 30 seconds timeout
		}
	);
}

/**
 * Navigate the SIA to get to the courses list
 *
 * Assumes level, place, faculty and program are already selected
 */
export async function scrapeCoursesWithTypologyHandle(
	snapshot: DocumentSnapshot,
	page: Page,
	payload: iCoursesPayload
): Promise<ElementHandle<Element>> {
	const { siaOldTypology, siaOldPlace } = snapshot.data()?.config || {};

	return TimedPromise<ElementHandle<Element>>(
		async (resolve, reject) => {
			// Attempt to load courses by typology
			if (!payload.typology) throw reject("Missing typology");

			if (!siaOldTypology?.[payload.typology] || !siaOldPlace?.[payload.place]) {
				throw reject("Missing typology or place list");
			}

			// Get typology options
			const typologyOptions = await getHTMLElementOptions(page, eHTMLElementIds.TYPOLOGY);
			const typologyValue = typologyOptions.find(({ alias }) => {
				return payload.typology && siaOldTypology?.[payload.typology] === alias;
			});

			if (!typologyValue) throw reject(`No typology found for ${payload.typology}`);

			// Select typology, by default the system will return all but LE
			await page.click(useHTMLElementId(eHTMLElementIds.TYPOLOGY));
			await page.select(useHTMLElementId(eHTMLElementIds.TYPOLOGY), typologyValue.value);

			// Necessary for switching between typologies
			// await page.waitForNetworkIdle();

			// Additional actions for LE (eSIATypology)
			if (payload.typology === "L LIBRE ELECCIÓN") {
				// await waitForSelect(page, eHTMLElementIds.SEARCH_LE);
				await page.waitForSelector(useHTMLElementId(eHTMLElementIds.SEARCH_LE), {
					visible: true,
				});

				// Select search mode, search by program
				await page.click(useHTMLElementId(eHTMLElementIds.SEARCH_LE));

				switch (payload.searchMode || "program") {
					case "faculty": {
						await page.select(useHTMLElementId(eHTMLElementIds.SEARCH_LE), "0");
						await page.waitForSelector(
							useHTMLElementId(eHTMLElementIds.FACULTY_PLACE_LE),
							{ visible: true }
						);

						// Select LE Place
						await page.click(useHTMLElementId(eHTMLElementIds.FACULTY_PLACE_LE));
						await page.select(
							useHTMLElementId(eHTMLElementIds.FACULTY_PLACE_LE),
							siaOldPlace[payload.place]
						);
						await page.waitForSelector(
							useHTMLElementId(eHTMLElementIds.FACULTY_FACULTY_LE),
							{ visible: true }
						);

						// Get LE faculty options
						const leFacultyOptions = await getHTMLElementOptions(
							page,
							eHTMLElementIds.FACULTY_FACULTY_LE
						);
						const leFacultyValue = leFacultyOptions.find(
							({ alias }) => payload.faculty === alias
						);

						if (!leFacultyValue) {
							throw reject(`No LE faculty found for ${payload.faculty}`);
						}

						// Select Faculty
						await page.click(useHTMLElementId(eHTMLElementIds.FACULTY_FACULTY_LE));
						await page.select(
							useHTMLElementId(eHTMLElementIds.FACULTY_FACULTY_LE),
							leFacultyValue.value
						);
						await page.waitForSelector(
							useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE),
							{ visible: true }
						);

						// Get LE Faculty program options
						// Less courses by scraping session, but less programs are related to a course (Precision)
						const leFacultyProgramOptions = await getHTMLElementOptions(
							page,
							eHTMLElementIds.PROGRAM_PROGRAM_LE
						);
						const leFacultyProgramValue = leFacultyProgramOptions.find(({ alias }) => {
							return SIALEPrograms[payload.place] === alias;
						});

						if (!leFacultyProgramValue) {
							throw reject(`No LE program found for ${payload.program}`);
						}

						// Search by LE program
						await page.click(useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE));
						await page.select(
							useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE),
							leFacultyProgramValue.value
						);

						break;
					}
					case "program":
					case "programOld": {
						await page.select(useHTMLElementId(eHTMLElementIds.SEARCH_LE), "1");
						await page.waitForSelector(
							useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE),
							{ visible: true }
						);

						// Get LE Program options
						const leProgramOptions = await getHTMLElementOptions(
							page,
							eHTMLElementIds.PROGRAM_PROGRAM_LE
						);
						const leProgramValue = leProgramOptions.find(({ alias }) => {
							// LE courses for this specific program, recommended
							if (payload.searchMode === "program") return payload.program === alias;

							// LE courses for this specific place
							// Since is the same as searching by LE place, not recommended
							return SIALEPrograms[payload.place] === alias;
						});

						if (!leProgramValue) {
							throw reject(`No LE program found for ${payload.program}`);
						}

						// Search by LE program
						await page.click(useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE));
						await page.select(
							useHTMLElementId(eHTMLElementIds.PROGRAM_PROGRAM_LE),
							leProgramValue.value
						);

						break;
					}
					default: {
						throw reject("Invalid search mode");
					}
				}
			}

			// Load courses (click show button)
			await page.waitForSelector(
				`${useHTMLElementId(eHTMLElementIds.SHOW)}:not(.p_AFDisabled)`
			);
			await page.click(useHTMLElementId(eHTMLElementIds.SHOW));

			// Check courses table if not already loaded
			const handle: ElementHandle<Element> | null = await page.waitForSelector(
				useHTMLElementId(eHTMLElementIds.TABLE),
				{ visible: true }
			);

			if (!handle) throw reject("Missing courses table");

			resolve(handle);
		},
		{
			timeout: 1000 * 30, // 30 seconds timeout
		}
	);
}
