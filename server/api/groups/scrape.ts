import { type Browser, Page, launch } from "puppeteer";
import type { iSelectOption } from "@open-xamu-co/ui-common-types";

import type { tWeeklySchedule } from "~/functions/src/types/entities";
import {
	eSIALevel,
	eSIAPlace,
	eSIATypology,
	type uSIAFaculty,
	type uSIAProgram,
} from "~/functions/src/types/SIA";
import type { Group } from "~/resources/types/entities";
import type { ScrapedCourse } from "~/resources/types/scraping";
import {
	eSIABogotaFaculty,
	eSIABogotaProgram,
	eSIALaPazFaculty,
	eSIALaPazProgram,
	eSIAManizalesFaculty,
	eSIAManizalesProgram,
	eSIAMedellinFaculty,
	eSIAMedellinProgram,
} from "~/functions/src/types/SIA/enums";
import { TimedPromise } from "~/resources/utils/promises";

/**
 * This scraper follows sia_scrapper implementation by https://github.com/pablomancera
 *
 * @see https://github.com/pablomancera/sia_scrapper
 */

enum eIds {
	LEVEL = "pt1:r1:0:soc1::content",
	PLACE = "pt1:r1:0:soc9::content",
	FACULTY = "pt1:r1:0:soc2::content",
	PROGRAM = "pt1:r1:0:soc3::content",
	TYPOLOGY = "pt1:r1:0:soc4::content",
	NAME = "pt1:r1:0:it11::content",
	SEARCH_LE = "pt1:r1:0:soc5::content",
	PROGRAM_LE = "pt1:r1:0:soc8::content",
	SHOW = "pt1:r1:0:cb1",
	TABLE = "pt1:r1:0:t4::db",
}

interface CourseLink {
	/** Element id */
	id: string;
	code: string;
	name: string;
	description: string;
}

export const eSIALevelOld: Record<eSIALevel, `${number}`> = {
	[eSIALevel.PREGRADO]: "0",
	// [eSIALevel.DOCTORADO]: "1",
	[eSIALevel.POSGRADO]: "2",
};

export const eSIAPlaceOld: Record<eSIAPlace, `${number}`> = {
	// [eSIAPlace.AMAZONIA]: "1",
	[eSIAPlace.BOGOTÁ]: "2",
	// [eSIAPlace.CARIBE]: "3",
	[eSIAPlace.LA_PAZ]: "4",
	[eSIAPlace.MANIZALES]: "5",
	[eSIAPlace.MEDELLÍN]: "6",
	// [eSIAPlace.ORINOQUIA]: "7",
	// [eSIAPlace.PALMIRA]: "8",
	// [eSIAPlace.TUMACO]: "9",
};

export const eSIATypologyOld: Record<eSIATypology, `${number}`> = {
	[eSIATypology.DISC_OBLIGATORIA]: "1",
	[eSIATypology.NIVELACIÓN]: "2",
	[eSIATypology.TRABAJO_DE_GRADO]: "3",
	[eSIATypology.FUND_OBLIGATORIA]: "4",
	[eSIATypology.DISC_OPTATIVA]: "5",
	[eSIATypology.FUND_OPTATIVA]: "6",
	[eSIATypology.LIBRE_ELECCIÓN]: "7",
};

/**
 * Await por page changes after selection
 *
 * @see https://github.com/pablomancera/sia_scrapper/blob/8ae60d0684212d066448edce13d113f948beb638/src/Tracker.ts#L381
 */
function waitForSelect(page: Page, type: eIds): Promise<unknown> {
	return page.evaluate((type: eIds) => {
		return new Promise((resolve, reject) => {
			const target = document.getElementById(type.replace("::content", ""))?.parentNode;

			const callback = (ml: MutationRecord[], obs: MutationObserver) => {
				for (const mut of ml) {
					resolve(mut);
					obs.disconnect();
				}
			};

			if (!target) return reject();

			new MutationObserver(callback).observe(target, { childList: true });
		});
	}, type);
}

/**
 * Parse options
 *
 * @see https://github.com/pablomancera/sia_scrapper/blob/8ae60d0684212d066448edce13d113f948beb638/src/Tracker.ts#L335
 */
function getOptions(page: Page, type: eIds) {
	return page.evaluate(async (id: string) => {
		const selectOptions: (iSelectOption & { value: string })[] = [];
		const element = document.getElementById(id);
		const options = Array.from(element?.getElementsByTagName("option") || []);

		for (const option of options) {
			if (!option.value) continue;

			selectOptions.push({
				value: option.value,
				alias: option.innerHTML.trim() || "Ninguno",
			});
		}

		return selectOptions;
	}, type);
}

function useId(id: string): string {
	return `#${id.replace(/:/g, "\\:")}`;
}

const puppetConfig = {
	headless: true,
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-accelerated-2d-canvas",
		"--no-first-run",
		"--no-zygote",
		"--disable-gpu",
	],
};

/**
 * Scrape course from old SIA
 *
 * @see https://github.com/pablomancera/sia_scrapper
 */
export default defineConditionallyCachedEventHandler(async (event, instance, auth) => {
	const { debugScrapper } = useRuntimeConfig().public;
	const { siaOldURL = "", siaOldPath = "", siaOldQuery = "" } = instance?.config || {};
	const siaOldEnpoint = siaOldURL + siaOldPath + siaOldQuery;

	// Require auth
	if (!auth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

	const puppet: Browser = await launch(puppetConfig);
	const puppetPage: Page = await puppet.newPage();

	/**
	 * Show puppet page logs
	 * @see https://stackoverflow.com/a/59919144/3304008
	 */
	if (debugScrapper) {
		puppetPage
			.on("console", (message) =>
				console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
			)
			.on("pageerror", ({ message }) => console.log(message))
			.on("response", (response) => console.log(`${response.status()} ${response.url()}`))
			.on("requestfailed", (request) =>
				console.log(`${request.failure()?.errorText} ${request.url()}`)
			);
	}

	// event data
	const params = getQuery(event);
	const name: string = getQueryParam("name", event) || "";
	const code: string = getQueryParam("code", event) || "";
	const level: eSIALevel = getQueryParam("level", event);
	const place: eSIAPlace = getQueryParam("place", event);
	// Compare against multiple sources before giving up
	let faculties: uSIAFaculty[] = Array.isArray(params.faculties)
		? params.faculties
		: [params.faculties];
	let programs: uSIAProgram[] = Array.isArray(params.programs)
		? params.programs
		: [params.programs];
	let typologies: eSIATypology[] = Array.isArray(params.typologies)
		? params.typologies
		: [params.typologies];

	// Override data if missing, assume LE
	if (!programs.length || !faculties.length) {
		typologies = [eSIATypology.LIBRE_ELECCIÓN];

		switch (place) {
			case eSIAPlace.BOGOTÁ:
				faculties = [eSIABogotaFaculty.SEDE_BOGOTÁ];
				programs = [eSIABogotaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN];
				break;
			case eSIAPlace.LA_PAZ:
				faculties = [eSIALaPazFaculty.SEDE_LA_PAZ];
				programs = [eSIALaPazProgram.COMPONENTE_DE_LIBRE_ELECCIÓN];
				break;
			case eSIAPlace.MEDELLÍN:
				faculties = [eSIAMedellinFaculty.SEDE_MEDELLÍN];
				programs = [eSIAMedellinProgram.COMPONENTE_DE_LIBRE_ELECCIÓN];
				break;
			case eSIAPlace.MANIZALES:
				faculties = [eSIAManizalesFaculty.SEDE_MANIZALES];
				programs = [eSIAManizalesProgram.COMPONENTE_DE_LIBRE_ELECCIÓN];
				break;
		}
	}

	debugFirebaseServer(event, "api:courses:scrape", {
		siaOldEnpoint,
		scrape: code || name,
		programs,
		typologies,
	});

	async function handler(): Promise<ScrapedCourse> {
		if (!siaOldURL || !siaOldPath) {
			throw createError({ statusCode: 500, statusMessage: "Missing endpoint" });
		}

		await puppetPage.goto(siaOldEnpoint);
		await puppetPage.evaluate(() => {
			// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
			if (document.querySelector("#d1")?.clientHeight === 1) {
				throw createError({
					statusCode: 500,
					statusMessage: "There was an error loading the page",
				});
			}
		});

		// Select level
		await puppetPage.click(useId(eIds.LEVEL));
		await puppetPage.select(useId(eIds.LEVEL), eSIALevelOld[level]);
		await waitForSelect(puppetPage, eIds.PLACE);

		// Select Place
		await puppetPage.click(useId(eIds.PLACE));
		await puppetPage.select(useId(eIds.PLACE), eSIAPlaceOld[place]);
		await waitForSelect(puppetPage, eIds.FACULTY);

		// Select Faculty
		const facultyOptions = await getOptions(puppetPage, eIds.FACULTY);
		const facultyValues = facultyOptions.filter(({ alias }) => {
			return alias && faculties.includes(<uSIAFaculty>alias);
		});

		if (!facultyValues.length) {
			throw createError({ statusCode: 400, statusMessage: "No faculties matched" });
		}

		const errors: any[] = [];
		let response: ScrapedCourse = { groups: [], code: "", name: "", description: "" };

		for (const facultyValue of facultyValues) {
			try {
				if (response.groups.length) return response;

				// Attempt to get groups from this faculty
				await puppetPage.click(useId(eIds.FACULTY));
				await puppetPage.select(useId(eIds.FACULTY), facultyValue.value);
				await waitForSelect(puppetPage, eIds.PROGRAM);

				// Select Program
				const programOptions = await getOptions(puppetPage, eIds.PROGRAM);
				const programValues = programOptions.filter(({ alias }) => {
					return alias && programs.includes(<uSIAProgram>alias);
				});

				if (!programValues.length) {
					throw createError({ statusCode: 400, statusMessage: "No programs matched" });
				}

				// Iterate over associated programs
				for (const programValue of programValues) {
					try {
						if (response.groups.length) return response;

						// Select Program
						await puppetPage.click(useId(eIds.PROGRAM));
						await puppetPage.select(useId(eIds.PROGRAM), programValue.value);
						await waitForSelect(puppetPage, eIds.TYPOLOGY);

						// Attempt to get groups from this program
						if (!typologies.length) {
							response = await getGroups();

							continue;
						}

						// Iterate over associated typologies
						for (const typology of typologies) {
							try {
								if (response.groups.length) return response;

								// Select typology, by default the system will return all but LE
								await puppetPage.click(useId(eIds.TYPOLOGY));
								await puppetPage.select(
									useId(eIds.TYPOLOGY),
									eSIATypologyOld[typology]
								);

								// Additional actions for LE
								if (typology === eSIATypology.LIBRE_ELECCIÓN) {
									await puppetPage.waitForSelector(useId(eIds.SEARCH_LE), {
										visible: true,
									});

									// Select search mode, search by program
									await puppetPage.click(useId(eIds.SEARCH_LE));
									await puppetPage.select(useId(eIds.SEARCH_LE), "1");
									await puppetPage.waitForSelector(useId(eIds.PROGRAM_LE), {
										visible: true,
									});

									// Select LE Program
									const programOptionsLE = await getOptions(
										puppetPage,
										eIds.PROGRAM_LE
									);
									const programLeValue = programOptionsLE.find(({ alias }) => {
										return alias && programs.includes(<uSIAProgram>alias);
									});

									if (!programLeValue) {
										throw createError({
											statusCode: 400,
											statusMessage: "LE program not found",
										});
									}

									await puppetPage.click(useId(eIds.PROGRAM_LE));
									await puppetPage.select(
										useId(eIds.PROGRAM_LE),
										programLeValue.value
									);
								}

								// Attempt to get groups from this typology
								response = await getGroups();
							} catch (err) {
								errors.push(err); // save typologies errors
							}
						}
					} catch (err) {
						errors.push(err); // save programs errors
					}
				}
			} catch (err) {
				errors.push(err); // save faculties errors
			}
		}

		// If no groups found, throw errors if any
		if (!response.groups.length && errors.length) throw createError(errors.pop());

		return response;
	}

	/**
	 * Get course groups from a given program
	 */
	async function getGroups(): Promise<ScrapedCourse> {
		// Search by name
		if (name) await puppetPage.type(useId(eIds.NAME), name);

		// Load courses
		await puppetPage.waitForSelector(`${useId(eIds.SHOW)}:not(.p_AFDisabled)`);
		await puppetPage.click(useId(eIds.SHOW));

		// Go to courses
		const tableHandle = await puppetPage.waitForSelector(useId(eIds.TABLE), { visible: true });

		if (!tableHandle) throw createError({ statusCode: 404, statusMessage: "Missing results" });

		// TODO: index all returned courses server side
		const courseLinks: CourseLink[] = await tableHandle.evaluate(async (table) => {
			const tbody = table?.querySelector("tbody");

			if (tbody?.tagName !== "TBODY") {
				throw createError({ statusCode: 404, statusMessage: "No courses found" });
			}

			const rows = tbody?.children;

			return Array.from(rows).map((row) => {
				const link = row.children[0].getElementsByTagName("a")[0];
				const nameSpan = row.children[1].querySelector("span[title]");
				const descriptionSpan = row.children[4].querySelector("span[title]");

				return {
					id: link.id,
					code: link.innerHTML,
					name: nameSpan?.innerHTML || "",
					description: descriptionSpan?.innerHTML || "",
				};
			});
		});
		const courseLink = courseLinks.find((item) => item.code === code);

		if (!courseLink) {
			throw createError({
				statusCode: 400,
				statusMessage: `No course matches the code ${code}`,
			});
		}

		await puppetPage.click(useId(courseLink.id));

		// Get groups
		await puppetPage.waitForNetworkIdle();

		const groups: Group[] = await puppetPage.evaluate(() => {
			const activityH3 = document.querySelector("span[id$=w-titulo] h3");

			function trimHTML(el?: Element | null) {
				return el ? el.innerHTML.trim() : "";
			}

			return Array.from(document.querySelectorAll("span[id$=pgl14]")).map((root) => {
				const teacherSpan = root.querySelector("span[id$=ot8]");
				const spotsSpan = root.querySelector("span[id$=ot24]");
				const spots: number = Number(trimHTML(spotsSpan)) || 0;
				const nameH2 = root.querySelector("h2.af_showDetailHeader_title-text0");
				const fullName = trimHTML(nameH2) || "(0) No reportado";
				const startAt = fullName.indexOf(")");
				const schedule: tWeeklySchedule = ["", "", "", "", "", "", ""];
				let classrooms: string[] = [];

				Array.from(root.querySelectorAll("span[id$=pgl10]")).forEach((scheduledSpace) => {
					const classroomSpan = scheduledSpace.lastElementChild?.children[1];
					const scheduleSpan = scheduledSpace.firstElementChild;
					const [day, unparsedSpan] = trimHTML(scheduleSpan).toLowerCase().split(" de ");

					if (!day || !unparsedSpan) {
						throw createError({
							statusCode: 400,
							statusMessage: "Non supported schedule format",
						});
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
				});

				return {
					spots,
					availableSpots: spots,
					schedule,
					classrooms,
					name: fullName.substring(startAt + 2),
					activity: trimHTML(activityH3) || "Desconocida",
					teachers: [trimHTML(teacherSpan).replaceAll(".", "") || "No Informado"],
				};
			});
		});

		return { groups, code, name: courseLink.name, description: courseLink.description };
	}

	// Time out after 2 minutes
	return TimedPromise<ScrapedCourse | false>(
		async (resolve, reject) => {
			try {
				const response = await handler();

				resolve(response);
			} catch (err) {
				puppet.close();

				if (isError(err)) serverLogger("api:groups:scrape", err.message, err);

				reject(err);
			}
		},
		false,
		120
	);
});
