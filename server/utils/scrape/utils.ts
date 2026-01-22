import { ProxyAgent } from "undici";
import { type Browser, Page, launch } from "puppeteer";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

import type { CachedH3Event, H3Context } from "@open-xamu-co/firebase-nuxt/server";
import type { iSelectOption } from "@open-xamu-co/ui-common-types";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { ExtendedInstance } from "~/utils/types/entities";
import type { ExtendedInstanceData, tWeeklySchedule } from "~~/functions/src/types/entities";
import { eSIATypology } from "~~/functions/src/types/SIA";

import { getProxies } from "./proxies";

export interface ExtendedH3Context extends H3Context {
	currentInstance?: ExtendedInstance & {
		millis: string;
		url: string;
		id: string;
	};
	currentInstanceRef?: DocumentReference<ExtendedInstanceData>;
}

export interface ExtendedH3Event extends CachedH3Event {
	context: ExtendedH3Context;
}

/**
 * This scraper follows sia_scrapper implementation by https://github.com/pablomancera
 *
 * @see https://github.com/pablomancera/sia_scrapper
 */

export enum eHTMLElementIds {
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

export interface CourseLink {
	code: string;
	credits: number;
	typology?: eSIATypology;
	name: string;
	description: string;
}

export interface CourseGroupLink {
	name: string;
	spots: number;
	schedule: tWeeklySchedule;
	teachers: string[];
	activity: string;
	classrooms: string[];
	periodStartAt: string;
	periodEndAt: string;
	availableSpots: number;
}

/**
 * Await por page changes after selection
 *
 * @see https://github.com/pablomancera/sia_scrapper/blob/8ae60d0684212d066448edce13d113f948beb638/src/Tracker.ts#L381
 */
export function waitForSelect(page: Page, type: eHTMLElementIds): Promise<unknown> {
	return page.evaluate((type: eHTMLElementIds) => {
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
export function getHTMLElementOptions(page: Page, type: eHTMLElementIds) {
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

export function useHTMLElementId(id: string): string {
	return `#${id.replace(/:/g, "\\:")}`;
}

const puppeteerArgs = [
	"--no-sandbox",
	"--disable-setuid-sandbox",
	"--disable-dev-shm-usage",
	"--disable-accelerated-2d-canvas",
	"--no-first-run",
	"--no-zygote",
	"--disable-gpu",
];

function makeCleanup(page: Page, browser: Browser) {
	/**
	 * Attempt to close everything
	 */
	return async function cleanup() {
		try {
			await page.close();
		} catch (err) {
			console.error(err);
		}

		await browser.close();
	};
}

/**
 * Show puppet page logs
 * @see https://stackoverflow.com/a/59919144/3304008
 */
function debugPage(page: Page, debug?: boolean): Page {
	if (!debug) return page;

	page.on("console", (message) =>
		console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
	)
		.on("pageerror", ({ message }) => console.log(message))
		.on("response", (response) => console.log(`${response.status()} ${response.url()}`))
		.on("requestfailed", (request) =>
			console.log(`${request.failure()?.errorText} ${request.url()}`)
		);

	return page;
}

/**
 * Puppeteer instance with proxy support
 */
export async function getPuppeteer(event: ExtendedH3Event, debug?: boolean) {
	const { firebaseFirestore } = getFirebase("getPuppeteer");
	const proxiesList = await getProxies(event);

	// Omit proxy if not found
	if (!proxiesList.length) {
		const browser: Browser = await launch({ headless: !debug, args: puppeteerArgs });
		const page: Page = debugPage(await browser.newPage(), debug);

		return { browser, page, cleanup: makeCleanup(page, browser) };
	}

	// Get working proxy
	while (proxiesList.length > 0) {
		// Pick a random proxy
		const randomIndex = Math.floor(Math.random() * proxiesList.length);
		const { proxy = "", path } = proxiesList[randomIndex];
		const testStartAt = new Date();

		try {
			const dispatcher = new ProxyAgent(proxy);
			let ok = false;

			await Promise.race([
				new Promise<void>((_resolve, reject) => {
					// Reject slow proxies, 30 seconds
					setTimeout(() => reject(new Error("Timeout")), 1000 * 30);
				}),
				$fetch("https://status.search.google.com", {
					dispatcher,
					onResponse({ response }) {
						ok = response.ok;
					},
				}),
			]);

			if (!ok) throw new Error("Proxy is not working");

			// Success! Get test duration in seconds
			const testEndAt = new Date();
			const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

			debugFirebaseServer(event, "getPuppeteer:success", { proxy, testDuration });

			// Update proxy score
			firebaseFirestore.doc(path).update({
				timesAlive: FieldValue.increment(1),
				timeout: testDuration, // Avg timeout recalculated in Cloud Function
			});

			const browser: Browser = await launch({
				headless: !debug,
				args: [...puppeteerArgs, `--proxy-server=${proxy}`],
			});
			const page: Page = debugPage(await browser.newPage(), debug);
			const cleanup = makeCleanup(page, browser);

			return { browser, page, cleanup };
		} catch (err) {
			// Error! Get test duration in seconds
			const testEndAt = new Date();
			const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

			// Report proxy error
			debugFirebaseServer(event, "getPuppeteer:error", { proxy, testDuration });
			apiLogger(event, "getPuppeteer:error", err, { proxy, testDuration });

			// Update proxy score
			firebaseFirestore.doc(path).update({
				timesDead: FieldValue.increment(1),
				timeout: testDuration, // Avg timeout recalculated in Cloud Function
			});

			// Remove proxy from list
			proxiesList.splice(randomIndex, 1);
		}
	}

	throw new Error("No working proxy found");
}
