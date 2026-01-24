import type { ElementHandle, Page } from "puppeteer-core";

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

import { type ExtendedH3Event } from "./utils";

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
export const SIATypologies: Record<string, eSIATypology> = {
	"DISCIPLINAR OPTATIVA (T)": eSIATypology.DISC_OPTATIVA,
	"DISCIPLINAR OBLIGATORIA (C)": eSIATypology.DISC_OBLIGATORIA,
	"FUND. OBLIGATORIA (B)": eSIATypology.FUND_OBLIGATORIA,
	"FUND. OPTATIVA (O)": eSIATypology.FUND_OPTATIVA,
	"NIVELACIÓN (E)": eSIATypology.NIVELACIÓN,
	"TRABAJO DE GRADO (P)": eSIATypology.TRABAJO_DE_GRADO,
	"LIBRE ELECCIÓN (L)": eSIATypology.LIBRE_ELECCIÓN,
} as const;

/**
 * Get to the courses list from sia
 */
export async function scrapeCoursesHandle(
	event: ExtendedH3Event,
	page: Page,
	payload: iCoursesPayload
): Promise<ElementHandle<Element>> {
	const { currentInstance } = event.context;
	const { siaOldURL = "", siaOldLevel, siaOldPlace } = currentInstance?.config || {};

	// SIA navigation is required beforehand
	if (!page.url().includes(siaOldURL)) throw new Error("Page is not the SIA");

	return TimedPromise<ElementHandle<Element>>(
		async function (resolve, reject) {
			await page.evaluate(() => {
				// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
				if (document.querySelector("#d1")?.clientHeight === 1) {
					throw reject("There was an error loading the page");
				}
			});

			if (!siaOldLevel?.[payload.level] || !siaOldPlace?.[payload.place]) {
				throw reject("Missing place or level lists");
			}

			debugFirebaseServer(event, "scrapeCoursesHandle", [payload.level, payload.place]);

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

			debugFirebaseServer(event, "scrapeCoursesHandle:faculty", payload.faculty);

			// Select Faculty
			await page.click(useHTMLElementId(eHTMLElementIds.FACULTY));
			await page.select(useHTMLElementId(eHTMLElementIds.FACULTY), facultyValue.value);
			await waitForSelect(page, eHTMLElementIds.PROGRAM);

			// Get program options
			const programOptions = await getHTMLElementOptions(page, eHTMLElementIds.PROGRAM);
			const programValue = programOptions.find(({ alias }) => payload.program === alias);

			if (!programValue) throw reject(`No program found for ${payload.program}`);

			debugFirebaseServer(event, "scrapeCoursesHandle:program", payload.program);

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
	event: ExtendedH3Event,
	page: Page,
	payload: iCoursesPayload
): Promise<ElementHandle<Element>> {
	const { currentInstance } = event.context;
	const { siaOldTypology } = currentInstance?.config || {};

	return TimedPromise<ElementHandle<Element>>(
		async (resolve, reject) => {
			// Attempt to load courses by typology
			if (!payload.typology) throw reject("Missing typology");

			if (!siaOldTypology?.[payload.typology]) throw reject("Missing typology list");

			// Get typology options
			const typologyOptions = await getHTMLElementOptions(page, eHTMLElementIds.TYPOLOGY);
			const typologyValue = typologyOptions.find(({ alias }) => {
				return payload.typology && siaOldTypology?.[payload.typology] === alias;
			});

			if (!typologyValue) throw reject(`No typology found for ${payload.typology}`);

			debugFirebaseServer(event, "scrapeCoursesHandle:typology", payload.typology);

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

				debugFirebaseServer(event, "scrapeCoursesHandle:typology:LE", payload.place);

				// Select search mode, search by program
				await page.click(useHTMLElementId(eHTMLElementIds.SEARCH_LE));
				await page.select(useHTMLElementId(eHTMLElementIds.SEARCH_LE), "1");
				await page.waitForSelector(useHTMLElementId(eHTMLElementIds.PROGRAM_LE), {
					visible: true,
				});

				// Get LE Program options
				const leProgramOptions = await getHTMLElementOptions(
					page,
					eHTMLElementIds.PROGRAM_LE
				);
				const leProgramValue = leProgramOptions.find(({ alias }) => {
					return SIALEPrograms[payload.place] === alias;
				});

				if (!leProgramValue) throw reject(`No LE program found for ${payload.place}`);

				debugFirebaseServer(
					event,
					"scrapeCoursesHandle:typology:LE:program",
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
