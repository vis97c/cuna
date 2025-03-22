import _ from "lodash";
import { type Browser, type LaunchOptions, Page, launch } from "puppeteer";
import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";

import type { iSelectOption } from "@open-xamu-co/ui-common-types";

import type { CourseData, TeacherData, tWeeklySchedule } from "~/functions/src/types/entities";
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
	// Amazonía
	eSIAAmazoniaFaculty,
	eSIAAmazoniaProgram,
	// Bogotá
	eSIABogotaFaculty,
	eSIABogotaProgram,
	// Caribe
	eSIACaribeFaculty,
	eSIACaribeProgram,
	// La Paz
	eSIALaPazFaculty,
	eSIALaPazProgram,
	// Manizales
	eSIAManizalesFaculty,
	eSIAManizalesProgram,
	// Medellín
	eSIAMedellinFaculty,
	eSIAMedellinProgram,
	// Orinoquia
	eSIAOrinoquiaFaculty,
	eSIAOrinoquiaProgram,
	// Palmira
	eSIAPalmiraFaculty,
	eSIAPalmiraProgram,
	// Tumaco
	eSIATumacoFaculty,
	eSIATumacoProgram,
} from "~/functions/src/types/SIA/enums";
import { TimedPromise } from "~/resources/utils/promises";
import { Cyrb53, triGram } from "~/resources/utils/firestore";

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

const puppetConfig: LaunchOptions = {
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
	if (instance?.config?.siaMaintenanceTillAt) {
		throw createError({ statusCode: 503, statusMessage: `SIA under maintenance` });
	}

	// Require auth
	if (!auth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

	const { serverFirestore } = getServerFirebase();
	const { debugScrapper } = useRuntimeConfig().public;
	const {
		siaOldURL = "",
		siaOldPath = "",
		siaOldQuery = "",
		siaOldLevel,
		siaOldPlace,
		siaOldTypology,
	} = instance?.config || {};
	const siaOldEnpoint = siaOldURL + siaOldPath + siaOldQuery;

	if (!siaOldURL || !siaOldPath) {
		throw createError({ statusCode: 500, statusMessage: "Missing endpoints" });
	}

	// event data
	const code: string = getQueryParam("code", event) || "";

	if (!code) throw createError({ statusCode: 400, statusMessage: `Missing course code` });

	debugFirebaseServer(event, "api:groups:scrape", { siaOldEnpoint, scrape: code });

	// Where, when & who
	const courseId = `courses/${Cyrb53([code])}`;
	const courseRef: DocumentReference<CourseData> = serverFirestore.doc(courseId);
	const scrapedAt = Timestamp.fromDate(new Date());
	const updatedByRef = serverFirestore.doc(auth.id);
	let attemp = 0;

	// Setup puppeteer
	const puppetBrowser: Browser = await launch(puppetConfig);
	const puppetPage: Page = await puppetBrowser.newPage();

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

	/**
	 * Get course groups from a given program
	 */
	async function getResponse(): Promise<Omit<ScrapedCourse, "lastScrapedWith">> {
		const currentAttemp = attemp;

		debugFirebaseServer(
			event,
			"api:groups:scrape:getResponse:start",
			`${code}, Attemp ${currentAttemp}`
		);

		attemp++;

		// Search by name
		// if (name) await puppetPage.type(useId(eIds.NAME), name);

		// Load courses
		await puppetPage.waitForSelector(`${useId(eIds.SHOW)}:not(.p_AFDisabled)`);
		await puppetPage.click(useId(eIds.SHOW));

		// Go to courses
		const tableHandle = await puppetPage.waitForSelector(useId(eIds.TABLE), { visible: true });

		if (!tableHandle) throw createError({ statusCode: 404, statusMessage: "Missing results" });

		// Get courses
		const courseLinks: CourseLink[] = await tableHandle.evaluate(async (table) => {
			const tbody = table?.querySelector("tbody");

			if (tbody?.tagName !== "TBODY") throw new Error("No courses found");

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
		await puppetPage.waitForNetworkIdle();

		try {
			// Get groups
			const groups: Group[] = await puppetPage.evaluate(() => {
				const trimHTML = (el?: Element | null) => (el ? el.innerHTML.trim() : "");
				const activityH3 = document.querySelector("span[id$=w-titulo] h3");
				const activity = trimHTML(activityH3) || "Desconocida";

				return Array.from(document.querySelectorAll("span[id$=pgl14]")).map((root) => {
					const teacherSpan = root.querySelector("span[id$=ot8]");
					const spotsSpan = root.querySelector("span[id$=ot24]");
					const spots: number = Number(trimHTML(spotsSpan)) || 0;
					const nameH2 = root.querySelector("h2.af_showDetailHeader_title-text0");
					const fullName = trimHTML(nameH2) || "(0) No reportado";
					const startAt = fullName.indexOf(")");
					const schedule: tWeeklySchedule = ["", "", "", "", "", "", ""];
					let classrooms: string[] = [];

					Array.from(root.querySelectorAll("span[id$=pgl10]")).forEach(
						(scheduledSpace) => {
							const classroomSpan = scheduledSpace.lastElementChild?.children[1];
							const scheduleSpan = scheduledSpace?.firstElementChild;
							const [day, unparsedSpan] = trimHTML(scheduleSpan)
								.toLowerCase()
								.split(" de ");

							if (!day || !unparsedSpan) {
								throw new Error("Non supported schedule format");
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
						name: fullName.substring(startAt + 2),
						teachers: [teacher || "No Informado"],
					};
				});
			});

			debugFirebaseServer(
				event,
				"api:groups:scrape:getResponse:end",
				`${code}, Attemp ${currentAttemp}, ${courseLink.name} with ${groups.length} groups`
			);

			return {
				code,
				groups,
				name: courseLink.name,
				description: courseLink.description,
			};
		} catch (err) {
			debugFirebaseServer(
				event,
				"api:groups:scrape:getResponse:endFail",
				`${code}, Attemp ${currentAttemp} with errors`,
				err
			);

			return {
				code,
				name: courseLink.name,
				description: courseLink.description,
			};
		}
	}

	/**
	 * Recursively scrape a course
	 */
	function scraper(
		level: eSIALevel,
		place: eSIAPlace,
		faculties: uSIAFaculty[] = [],
		programs: uSIAProgram[] = [],
		typologies: eSIATypology[] = []
	): Promise<ScrapedCourse> {
		// Compare against multiple sources before giving up
		const LE = typologies.includes(eSIATypology.LIBRE_ELECCIÓN);
		const LEByProgram = !programs[0];
		const LEByFaculty = !faculties[0];

		// Override data if missing, assume LE
		if (LEByProgram || LE || LEByFaculty) {
			if (!typologies.includes(eSIATypology.LIBRE_ELECCIÓN)) {
				typologies.push(eSIATypology.LIBRE_ELECCIÓN);
			}

			switch (place) {
				case eSIAPlace.BOGOTÁ:
					if (LEByFaculty) faculties.push(eSIABogotaFaculty.SEDE_BOGOTÁ);
					if (LEByProgram || LE) {
						programs.push(eSIABogotaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.LA_PAZ:
					if (LEByFaculty) faculties.push(eSIALaPazFaculty.SEDE_LA_PAZ);
					if (LEByProgram || LE) {
						programs.push(eSIALaPazProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.MEDELLÍN:
					if (LEByFaculty) faculties.push(eSIAMedellinFaculty.SEDE_MEDELLÍN);
					if (LEByProgram) {
						programs.push(eSIAMedellinProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.MANIZALES:
					if (LEByFaculty) faculties.push(eSIAManizalesFaculty.SEDE_MANIZALES);
					if (LEByProgram) {
						programs.push(eSIAManizalesProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.PALMIRA:
					if (LEByFaculty) faculties.push(eSIAPalmiraFaculty.SEDE_PALMIRA);
					if (LEByProgram || LE) {
						programs.push(eSIAPalmiraProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.TUMACO:
					if (LEByFaculty) faculties.push(eSIATumacoFaculty.SEDE_TUMACO);
					if (LEByProgram || LE) {
						programs.push(eSIATumacoProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.AMAZONÍA:
					if (LEByFaculty) faculties.push(eSIAAmazoniaFaculty.SEDE_AMAZONIA);
					if (LEByProgram) {
						programs.push(eSIAAmazoniaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.CARIBE:
					if (LEByFaculty) faculties.push(eSIACaribeFaculty.SEDE_CARIBE);
					if (LEByProgram || LE) {
						programs.push(eSIACaribeProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
				case eSIAPlace.ORINOQUÍA:
					if (LEByFaculty) faculties.push(eSIAOrinoquiaFaculty.SEDE_ORINOQUIA);
					if (LEByProgram) {
						programs.push(eSIAOrinoquiaProgram.COMPONENTE_DE_LIBRE_ELECCIÓN);
					}

					break;
			}
		}

		return TimedPromise<ScrapedCourse>(
			async function (resolve, reject) {
				await puppetPage.goto(siaOldEnpoint);
				await puppetPage.evaluate(() => {
					// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
					if (document.querySelector("#d1")?.clientHeight === 1) {
						throw new Error("There was an error loading the page");
					}
				});

				if (!siaOldLevel?.[level] || !siaOldPlace?.[place]) {
					throw reject({
						statusCode: 500,
						statusMessage: "Missing place or level lists",
					});
				}

				// Select level
				await puppetPage.click(useId(eIds.LEVEL));
				await puppetPage.select(useId(eIds.LEVEL), siaOldLevel[level]);
				await waitForSelect(puppetPage, eIds.PLACE);

				// Select Place
				await puppetPage.click(useId(eIds.PLACE));
				await puppetPage.select(useId(eIds.PLACE), siaOldPlace[place]);
				await waitForSelect(puppetPage, eIds.FACULTY);

				// Select Faculty
				const facultyOptions = await getOptions(puppetPage, eIds.FACULTY);
				const facultyValues = facultyOptions.filter(({ alias }) => {
					return alias && faculties.includes(<uSIAFaculty>alias);
				});

				if (!facultyValues.length) {
					throw reject({ statusCode: 400, statusMessage: "No faculties matched" });
				}

				const errors: any[] = [];
				let response: ScrapedCourse = {
					groups: [],
					code: "", // Valid response would replace this
					name: "",
					description: "",
					lastScrapedWith: [level, place],
				};

				for (const facultyValue of facultyValues) {
					if (response.code) break;

					debugFirebaseServer(
						event,
						"api:groups:scrape:scraper:faculty",
						[facultyValue.alias],
						response.groups?.length
					);

					try {
						// Attempt to get groups from this faculty
						await puppetPage.click(useId(eIds.FACULTY));
						await puppetPage.select(useId(eIds.FACULTY), facultyValue.value);
						await waitForSelect(puppetPage, eIds.PROGRAM);

						// Select Program
						const programOptions = await getOptions(puppetPage, eIds.PROGRAM);
						const programValues = programOptions.filter(({ alias }) => {
							if (LEByProgram) return true;

							return alias && programs.includes(<uSIAProgram>alias);
						});

						if (!programValues.length) {
							throw new Error("No programs matched");
						}

						// Iterate over associated programs
						for (const programValue of programValues) {
							if (response.code) break;

							debugFirebaseServer(
								event,
								"api:groups:scrape:scraper:program",
								[facultyValue.alias, programValue.alias],
								response.groups?.length
							);

							try {
								// Select Program
								await puppetPage.click(useId(eIds.PROGRAM));
								await puppetPage.select(useId(eIds.PROGRAM), programValue.value);
								await waitForSelect(puppetPage, eIds.TYPOLOGY);

								// Attempt to get groups from this program
								if (!typologies.length) {
									const partialResponse = await getResponse();

									response = {
										...partialResponse,
										lastScrapedWith: [
											level,
											place,
											<uSIAFaculty>facultyValue.alias,
											<uSIAProgram>programValue.alias,
										],
									};

									continue;
								}

								const typologyOptions = await getOptions(puppetPage, eIds.TYPOLOGY);

								// Iterate over associated typologies
								for (const typology of typologies) {
									if (response.code) break;

									debugFirebaseServer(
										event,
										"api:groups:scrape:scraper:typology",
										[facultyValue.alias, programValue.alias, typology],
										response.groups?.length
									);

									try {
										// Select Typology
										const typologyValue = typologyOptions.find(({ alias }) => {
											return alias && alias === siaOldTypology?.[typology];
										});

										if (!typologyValue) {
											throw new Error("No typologies matched");
										}

										// Select typology, by default the system will return all but LE
										await puppetPage.click(useId(eIds.TYPOLOGY));
										await puppetPage.select(
											useId(eIds.TYPOLOGY),
											typologyValue.value
										);

										// Additional actions for LE
										if (typology === eSIATypology.LIBRE_ELECCIÓN) {
											await puppetPage.waitForSelector(
												useId(eIds.SEARCH_LE),
												{ visible: true }
											);

											// Select search mode, search by program
											await puppetPage.click(useId(eIds.SEARCH_LE));
											await puppetPage.select(useId(eIds.SEARCH_LE), "1");
											await puppetPage.waitForSelector(
												useId(eIds.PROGRAM_LE),
												{ visible: true }
											);

											// Select LE Program
											const programOptionsLE = await getOptions(
												puppetPage,
												eIds.PROGRAM_LE
											);
											const programLeValue = programOptionsLE.find(
												({ alias }) => {
													return (
														alias &&
														programs.includes(<uSIAProgram>alias)
													);
												}
											);

											if (!programLeValue) {
												throw new Error("LE program not found");
											}

											await puppetPage.click(useId(eIds.PROGRAM_LE));
											await puppetPage.select(
												useId(eIds.PROGRAM_LE),
												programLeValue.value
											);

											debugFirebaseServer(
												event,
												"api:groups:scrape:scraper:typology:LE",
												programLeValue
											);
										}

										// Necessary for switching between typologies
										await puppetPage.waitForNetworkIdle();

										// Attempt to get groups from this typology
										const partialResponse = await getResponse();

										response = {
											...partialResponse,
											lastScrapedWith: [
												level,
												place,
												<uSIAFaculty>facultyValue.alias,
												<uSIAProgram>programValue.alias,
												typology,
											],
										};
									} catch (err) {
										errors.push(err); // save typologies errors

										debugFirebaseServer(
											event,
											"api:groups:scrape:scraper:typologyError",
											[facultyValue.alias, programValue.alias, typology],
											err
										);
									}
								}
							} catch (err) {
								errors.push(err); // save programs errors

								debugFirebaseServer(
									event,
									"api:groups:scrape:scraper:programError",
									[facultyValue.alias, programValue.alias],
									err
								);
							}
						}
					} catch (err) {
						errors.push(err); // save faculties errors

						debugFirebaseServer(
							event,
							"api:groups:scrape:scraper:facultyError",
							[facultyValue.alias],
							err
						);
					}
				}

				// If no groups found, throw errors if any
				if (!response.groups?.length && errors.length) throw reject(errors.pop());

				resolve(response);
			},
			undefined,
			120
		);
	}

	/**
	 * Update firebase course
	 */
	async function updateCourse(): Promise<boolean> {
		try {
			let SIAScraps: ScrapedCourse;
			const courseSnapshot = await courseRef.get();

			if (!courseSnapshot.exists) {
				throw createError({
					statusCode: 404,
					statusMessage: `Course with code ${code} doesn't exist`,
				});
			}

			const { lastScrapedWith, ...course } = courseSnapshot.data() || {};

			try {
				if (!lastScrapedWith) throw new Error("LastScrapedWith is not defined");

				// Try last scraped with
				const [level, place, faculty, program, typology] = lastScrapedWith;
				const faculties = faculty ? [faculty] : [];
				const programs = program ? [program] : [];
				const typologies = typology ? [typology] : [];

				SIAScraps = await scraper(level, place, faculties, programs, typologies);
			} catch (err) {
				const {
					level = eSIALevel.PREGRADO,
					place = eSIAPlace.BOGOTÁ,
					faculties = [],
					programs = [],
					typologies = [],
				} = course;

				// Fallback to default behavior
				SIAScraps = await scraper(level, place, faculties, programs, typologies);
			}

			await puppetBrowser.close(); // Close browser

			debugFirebaseServer(
				event,
				"api:groups:scrape:updateCourse",
				`Success scraping: ${code}, ${SIAScraps.name}`
			);

			// Prevent updating if missing groups
			if (SIAScraps.groups) {
				// Index teachers
				SIAScraps.groups = SIAScraps.groups?.map(({ teachers, ...group }) => {
					teachers = teachers?.map((teacher) => {
						// Generate deduped teacher UID
						const teacherId = `teachers/${Cyrb53([_.deburr(teacher)])}`;
						const teacherRef: DocumentReference<TeacherData> =
							serverFirestore.doc(teacherId);
						const name = _.startCase(teacher.toLowerCase());

						// Set teacher, do not await
						teacherRef.set(
							{
								name,
								indexes: triGram([teacher]),
								courses: FieldValue.arrayUnion(SIAScraps.code),
							},
							{ merge: true }
						);

						return name;
					});

					return { ...group, teachers };
				});

				// Update course, do not await
				courseRef.set(
					{
						lastScrapedWith: SIAScraps.lastScrapedWith,
						description: SIAScraps.description,
						groups: SIAScraps.groups,
						scrapedWithErrorsAt: FieldValue.delete(),
						scrapedAt,
						updatedAt: scrapedAt,
						updatedByRef,
					},
					{ merge: true }
				);
			}

			return true;
		} catch (err) {
			debugFirebaseServer(event, "api:groups:scrape:updateCourse:err", err);

			const serializedError: Record<string, unknown> = JSON.parse(
				JSON.stringify(err, Object.getOwnPropertyNames(err))
			);
			const logsRef: DocumentReference<CourseData> = serverFirestore.collection("logs").doc();

			await puppetBrowser.close(); // Close browser

			// Update course, do not await
			courseRef.set(
				{
					lastScrapedWith: FieldValue.delete(),
					scrapedWithErrorsAt: scrapedAt,
					scrapedAt,
					updatedAt: scrapedAt,
					updatedByRef,
				},
				{ merge: true }
			);

			// Custom error log, do not await
			logsRef.set({
				at: "api:groups:scrape:updateCourse",
				message: serializedError.message,
				courseRef,
				error: { ...serializedError, url: event.path },
				updatedAt: scrapedAt,
				createdAt: scrapedAt,
				createdByRef: updatedByRef,
				updatedByRef,
			});

			return false;
		}
	}

	return updateCourse();
});
