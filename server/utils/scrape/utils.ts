import { default as puppeteer, type Browser, type Page } from "puppeteer";
import { ProxyAgent } from "undici";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

import type { CachedH3Event, H3Context } from "@open-xamu-co/firebase-nuxt/server";
import type { iSelectOption } from "@open-xamu-co/ui-common-types";
import { debugFirebaseServer } from "@open-xamu-co/firebase-nuxt/server/firestore";
import { apiLogger } from "@open-xamu-co/firebase-nuxt/server/firebase";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { ExtendedInstance } from "~/utils/types/entities";
import type {
	ExtendedInstanceData,
	ExtendedInstanceDataConfig,
	tWeeklySchedule,
} from "~~/functions/src/types/entities";
import { eSIATypology } from "~~/functions/src/types/SIA";

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
	// Search by program
	PROGRAM_PROGRAM_LE = "pt1:r1:0:soc8::content",
	// Search by faculty
	FACULTY_PLACE_LE = "pt1:r1:0:soc10::content",
	FACULTY_FACULTY_LE = "pt1:r1:0:soc6::content",
	FACULTY_PROGRAM_LE = "pt1:r1:0:soc7::content",
	// Results
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
	typology: eSIATypology;
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
		.on("pageerror", (err) => {
			if (err instanceof Error) console.log(err.message);
		})
		.on("response", (response) => console.log(`${response.status()} ${response.url()}`))
		.on("requestfailed", (request) =>
			console.log(`${request.failure()?.errorText} ${request.url()}`)
		);

	return page;
}

/**
 * Puppeteer instance with proxy support
 *
 * @debug @sparticuz/chromium does not run on windows
 */
export async function getPuppeteer(event: ExtendedH3Event, debug?: boolean) {
	const { firebaseFirestore } = getFirebase("getPuppeteer");
	const config: ExtendedInstanceDataConfig = event.context.currentInstance?.config || {};
	const getProxies = makeGetProxies(debug);
	const proxiesList = await getProxies(event);

	async function setupBrowser(args: string[] = []): Promise<Browser> {
		// Puppeteer instance
		const browser = await puppeteer.launch({
			headless: !debug,
			args: [...puppeteerArgs, ...args],
		});

		return browser;
	}

	try {
		if (!proxiesList.length) throw new Error("No proxies found");

		debugFirebaseServer(event, "getPuppeteer", { proxiesCount: proxiesList.length });

		const testStartAt = new Date();
		// Get the fastest proxy
		const proxyItem = await Promise.any(
			proxiesList.map(async (item) => {
				const { proxy, path } = item;
				const proxyRef = firebaseFirestore.doc(path);

				try {
					if (!proxy) throw new Error(`Missing proxy URL for "${path}"`);

					const dispatcher = new ProxyAgent(proxy);
					let ok = false;

					await $fetch(config.pingUrl || "https://status.search.google.com", {
						dispatcher,
						onResponse({ response }) {
							ok = response.ok;
						},
						timeout: 1000 * 60, // 60 seconds
					});

					if (!ok) throw new Error(`Proxy "${proxy}" is not working`);

					// Success! Get test duration in seconds
					const testEndAt = new Date();
					const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

					debugFirebaseServer(event, "getPuppeteer:try:success", { proxy, testDuration });

					// Update proxy score, do not await
					proxyRef.update({ timesAlive: FieldValue.increment(1), timeout: testDuration });

					return item; // Resolve promise
				} catch (err) {
					// Error! Get test duration in seconds
					const testEndAt = new Date();
					const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

					// Report proxy error
					debugFirebaseServer(event, "getPuppeteer:try:error", { proxy, testDuration });
					apiLogger(event, "getPuppeteer:try:error", err, { proxy, testDuration });

					// Update proxy score, do not await
					proxyRef.update({ timesDead: FieldValue.increment(1), timeout: testDuration });

					throw err; // Reject promise
				}
			})
		);

		// Launch browser with proxy
		const browser = await setupBrowser([`--proxy-server=${proxyItem.proxy}`]);
		const page: Page = debugPage(await browser.newPage(), debug);
		const cleanup = makeCleanup(page, browser);

		return { browser, page, cleanup, proxy: proxyItem };
	} catch (err) {
		apiLogger(event, "getPuppeteer:error", err);

		const browser = await setupBrowser();
		const page: Page = debugPage(await browser.newPage(), debug);
		const cleanup = makeCleanup(page, browser);

		return { browser, page, cleanup, proxy: null };
	}
}

/**
 * Retry puppeteer operation
 * @see https://webscraping.ai/faq/puppeteer/how-to-handle-errors-in-puppeteer
 *
 * @param operation	Operation to retry
 * @param maxRetries	Maximum number of retries
 * @param delay	Delay between retries
 * @returns Result of operation
 */
export async function retryPuppeteerOperation<T>(
	operation: () => Promise<T>,
	maxRetries = 2,
	delay = 1000
) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (err) {
			if (err && typeof err === "object" && "message" in err) {
				console.error(`Attempt ${attempt} failed:`, err.message);

				if (attempt === maxRetries) {
					throw new Error(
						`Operation failed after ${maxRetries} attempts: ${err.message}`
					);
				}
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay * attempt));
		}
	}
}
