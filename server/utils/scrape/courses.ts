import type { ElementHandle, Page } from "puppeteer";
import { createHash } from "node:crypto";

import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";
import { TimedPromise } from "@open-xamu-co/firebase-nuxt/server/guards";

import {
	eSIAAmazoniaProgram,
	eSIABogotaProgram,
	eSIACaribeProgram,
	eSIALaPazProgram,
	eSIALevel,
	eSIAManizalesProgram,
	eSIAMedellinProgram,
	eSIAOrinoquiaProgram,
	eSIAPalmiraProgram,
	eSIAPlace,
	eSIATumacoProgram,
	eSIATypology,
	type uSIAFaculty,
	type uSIAProgram,
} from "~~/functions/src/types/SIA";

import { getPuppeteer, type ExtendedH3Event } from "./utils";

export interface iCoursesPayload {
	level: eSIALevel;
	place: eSIAPlace;
	faculty: uSIAFaculty;
	program: uSIAProgram;
	typology?: eSIATypology;
}

/**
 * Returns the LE program for a given place
 */
const SIALEPrograms: Record<eSIAPlace, uSIAProgram> = {
	[eSIAPlace.BOGOTÁ]: eSIABogotaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.MEDELLÍN]: eSIAMedellinProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.PALMIRA]: eSIAPalmiraProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.TUMACO]: eSIATumacoProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.ORINOQUÍA]: eSIAOrinoquiaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.LA_PAZ]: eSIALaPazProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.AMAZONÍA]: eSIAAmazoniaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.MANIZALES]: eSIAManizalesProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
	[eSIAPlace.CARIBE]: eSIACaribeProgram.COMPONENTE_DE_LIBRE_ELECCIÓN,
} as const;

/**
 * From OldSIA to SIA typologies
 */
const SIATypologies: Record<string, eSIATypology> = {
	"DISCIPLINAR OPTATIVA (T)": eSIATypology.DISC_OPTATIVA,
	"DISCIPLINAR OBLIGATORIA (C)": eSIATypology.DISC_OBLIGATORIA,
	"FUND. OBLIGATORIA (B)": eSIATypology.FUND_OBLIGATORIA,
	"FUND. OPTATIVA (O)": eSIATypology.FUND_OPTATIVA,
	"NIVELACIÓN (E)": eSIATypology.NIVELACIÓN,
	"TRABAJO DE GRADO (P)": eSIATypology.TRABAJO_DE_GRADO,
	"LIBRE ELECCIÓN (L)": eSIATypology.LIBRE_ELECCIÓN,
} as const;

/**
 * Navigate the SIA to get to the courses list
 *
 * If already loaded, could reuse page for typologies (two searches)
 */
export async function getCoursesHandle(
	event: ExtendedH3Event,
	page: Page,
	payload: iCoursesPayload
): Promise<ElementHandle<Element>> {
	const { currentInstance } = event.context;
	const {
		siaOldURL = "",
		siaOldPath = "",
		siaOldQuery = "",
		siaOldLevel,
		siaOldPlace,
		siaOldTypology,
	} = currentInstance?.config || {};
	const siaOldEnpoint = siaOldURL + siaOldPath + siaOldQuery;

	return TimedPromise<ElementHandle<Element>>(
		async function (resolve, _reject) {
			// Look if already loaded, minimal timeout (Already loaded)
			let handle: ElementHandle<Element> | null = null;

			// try {
			// 	const currentUrl = page.url();

			// 	if (currentUrl.includes(siaOldURL)) {
			// 		handle = await page.waitForSelector(useHTMLElementId(eHTMLElementIds.TABLE), {
			// 			visible: true,
			// 		});
			// 	}
			// } catch (error) {
			// 	// Ignore error, it's normal if not already loaded
			// }

			// Attempt to load courses if not already loaded
			if (!handle) {
				await page.goto(siaOldEnpoint);
				await page.evaluate(() => {
					// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
					if (document.querySelector("#d1")?.clientHeight === 1) {
						throw new Error("There was an error loading the page");
					}
				});

				if (!siaOldLevel?.[payload.level] || !siaOldPlace?.[payload.place]) {
					throw new Error("Missing place or level lists");
				}

				debugFirebaseServer(event, "getCoursesHandle", [payload.level, payload.place]);

				// Select level
				await page.click(useHTMLElementId(eHTMLElementIds.LEVEL));
				await page.select(
					useHTMLElementId(eHTMLElementIds.LEVEL),
					siaOldLevel[payload.level]
				);
				await waitForSelect(page, eHTMLElementIds.PLACE);

				// Select Place
				await page.click(useHTMLElementId(eHTMLElementIds.PLACE));
				await page.select(
					useHTMLElementId(eHTMLElementIds.PLACE),
					siaOldPlace[payload.place]
				);
				await waitForSelect(page, eHTMLElementIds.FACULTY);

				// Get faculty options
				const facultyOptions = await getHTMLElementOptions(page, eHTMLElementIds.FACULTY);
				const facultyValue = facultyOptions.find(({ alias }) => payload.faculty === alias);

				if (!facultyValue) throw new Error(`No faculty found for ${payload.faculty}`);

				debugFirebaseServer(event, "getCoursesHandle:faculty", payload.faculty);

				// Select Faculty
				await page.click(useHTMLElementId(eHTMLElementIds.FACULTY));
				await page.select(useHTMLElementId(eHTMLElementIds.FACULTY), facultyValue.value);
				await waitForSelect(page, eHTMLElementIds.PROGRAM);

				// Get program options
				const programOptions = await getHTMLElementOptions(page, eHTMLElementIds.PROGRAM);
				const programValue = programOptions.find(({ alias }) => payload.program === alias);

				if (!programValue) throw new Error(`No program found for ${payload.program}`);

				debugFirebaseServer(event, "getCoursesHandle:program", payload.program);

				// Select Program
				await page.click(useHTMLElementId(eHTMLElementIds.PROGRAM));
				await page.select(useHTMLElementId(eHTMLElementIds.PROGRAM), programValue.value);
				await waitForSelect(page, eHTMLElementIds.TYPOLOGY);
			}

			// Attempt to load courses by typology
			if (payload.typology) {
				if (!siaOldTypology?.[payload.typology]) {
					throw new Error("Missing typology list");
				}

				// Get typology options
				const typologyOptions = await getHTMLElementOptions(page, eHTMLElementIds.TYPOLOGY);
				const typologyValue = typologyOptions.find(({ alias }) => {
					return payload.typology && siaOldTypology?.[payload.typology] === alias;
				});

				if (!typologyValue) throw new Error(`No typology found for ${payload.typology}`);

				debugFirebaseServer(event, "getCoursesHandle:typology", payload.typology);

				// Select typology, by default the system will return all but LE
				await page.click(useHTMLElementId(eHTMLElementIds.TYPOLOGY));
				await page.select(useHTMLElementId(eHTMLElementIds.TYPOLOGY), typologyValue.value);

				// Necessary for switching between typologies
				await page.waitForNetworkIdle();

				// Additional actions for LE
				if (payload.typology === eSIATypology.LIBRE_ELECCIÓN) {
					await page.waitForSelector(useHTMLElementId(eHTMLElementIds.SEARCH_LE), {
						visible: true,
					});

					debugFirebaseServer(event, "getCoursesHandle:typology:LE", payload.place);

					// Select search mode, search by program
					await page.click(useHTMLElementId(eHTMLElementIds.SEARCH_LE));
					await page.select(useHTMLElementId(eHTMLElementIds.SEARCH_LE), "1");
					await page.waitForSelector(useHTMLElementId(eHTMLElementIds.PROGRAM_LE), {
						visible: true,
					});

					// Get LE Program options
					const leProgramOptions = await getHTMLElementOptions(
						page,
						eHTMLElementIds.TYPOLOGY
					);
					const leProgramValue = leProgramOptions.find(({ alias }) => {
						return SIALEPrograms[payload.place] === alias;
					});

					if (!leProgramValue) {
						throw new Error(`No LE program found for ${payload.place}`);
					}

					debugFirebaseServer(
						event,
						"getCoursesHandle:typology:LE:program",
						leProgramValue.alias
					);

					// Search by LE program
					await page.click(useHTMLElementId(eHTMLElementIds.PROGRAM_LE));
					await page.select(
						useHTMLElementId(eHTMLElementIds.PROGRAM_LE),
						leProgramValue.value
					);

					// Necessary for switching between LE programs
					await page.waitForNetworkIdle();
				}
			}

			// Load courses (click show button)
			await page.waitForSelector(
				`${useHTMLElementId(eHTMLElementIds.SHOW)}:not(.p_AFDisabled)`
			);
			await page.click(useHTMLElementId(eHTMLElementIds.SHOW));

			// Check courses table if not already loaded
			handle ||= await page.waitForSelector(useHTMLElementId(eHTMLElementIds.TABLE), {
				visible: true,
			});

			if (!handle) throw new Error("Missing courses table");

			resolve(handle);
		},
		{ timeout: 120 }
	);
}

/**
 * Get courses from SIA
 *
 * @cache 2 minutes
 */
export const getCoursesLinks = defineCachedFunction(
	async (event: ExtendedH3Event, payload: iCoursesPayload) => {
		const { debugScrapper } = useRuntimeConfig();
		const { browser, page } = await getPuppeteer(debugScrapper);

		try {
			const coursesHandle = await getCoursesHandle(event, page, payload);

			// Get courses
			const courseLinks: CourseLink[] = await coursesHandle.evaluate(async (table) => {
				const tbody = table?.querySelector("tbody");

				// No courses found
				if (tbody?.tagName !== "TBODY") return [];

				return Array.from(tbody?.children).map((row) => {
					const link = row.children[0].getElementsByTagName("a")[0];
					const code = link.innerHTML;
					const nameSpan = row.children[1].querySelector("span[title]");
					const creditSpan = row.children[2].querySelector("span[title]");
					const typologySpan = row.children[3].querySelector("span[title]");
					const descriptionSpan = row.children[4].querySelector("span[title]");
					const typology = typologySpan?.innerHTML
						? SIATypologies[typologySpan.innerHTML]
						: undefined;

					return {
						code,
						name: nameSpan?.innerHTML || "",
						credits: Number(creditSpan?.innerHTML || 0),
						typology,
						description: descriptionSpan?.innerHTML || "",
					};
				});
			});

			browser.close(); // Cleanup, do not await

			return courseLinks;
		} catch (err) {
			browser.close(); // Cleanup, do not await
			apiLogger(event, "getCoursesLinks", err);

			// Prevent caching by throwing error
			throw err;
		}
	},
	{
		name: "getCoursesLinks",
		maxAge: 60 * 2, // 2 minutes
		getKey(event, payload) {
			const { currentInstanceHost } = event.context;
			const { level, place, faculty, program, typology = "" } = payload;
			const values = [level, place, faculty, program, typology];
			const hash = createHash("sha256").update(values.join(",")).digest("hex");

			// Compact hash
			return `${currentInstanceHost}:${hash}`;
		},
	}
);
