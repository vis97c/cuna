import { default as puppeteer, type Browser, type Page } from "puppeteer";
import { ProxyAgent, fetch } from "undici";
import { FieldValue } from "firebase-admin/firestore";

import type { iSelectOption, tLogger } from "@open-xamu-co/ui-common-types";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { eHTMLElementIds } from "../types/scrapper.js";
import { getProxies } from "./proxies.js";

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
 */
export async function getPuppeteer(logger: tLogger, pingUrl?: string, debug?: boolean) {
	const { firebaseFirestore } = getFirebase("getPuppeteer");
	const proxiesList = await getProxies(logger, debug);

	async function setupBrowser(args: string[] = []): Promise<Browser> {
		// Puppeteer instance
		return puppeteer.launch({
			headless: !debug,
			args: [...puppeteerArgs, ...args],
		});
	}

	try {
		if (!proxiesList.length) throw new Error("No proxies found");

		const testStartAt = new Date();
		// Get the fastest proxy
		const proxyItem = await Promise.any(
			proxiesList.map(async (item) => {
				const { proxy, path } = item;
				const proxyRef = firebaseFirestore.doc(path);

				try {
					if (!proxy) throw new Error(`Missing proxy URL for "${path}"`);

					const dispatcher = new ProxyAgent(proxy);
					const signal = AbortSignal.timeout(1000 * 60); // 60 seconds
					const { ok } = await fetch(pingUrl || "https://status.search.google.com", {
						dispatcher,
						signal,
					});

					if (!ok) throw new Error(`Proxy "${proxy}" is not working`);

					// Success! Get test duration in seconds
					const testEndAt = new Date();
					const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

					// Update proxy score, do not await
					proxyRef.update({ timesAlive: FieldValue.increment(1), timeout: testDuration });

					return item; // Resolve promise
				} catch (err) {
					// Error! Get test duration in seconds
					const testEndAt = new Date();
					const testDuration = (testEndAt.getTime() - testStartAt.getTime()) / 1000;

					// Report proxy error
					logger("getPuppeteer:try:error", err, { proxy, testDuration });

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

		// Enable request interception
		await page.setRequestInterception(true);

		// Block requests
		page.on("request", (request) => {
			const url = request.url();

			if (
				url.endsWith(".woff2") ||
				url.endsWith(".woff") ||
				url.endsWith(".gif") ||
				url.endsWith(".png") ||
				url.endsWith(".jpg") ||
				url.endsWith(".jpeg") ||
				url.endsWith(".svg")
			) {
				// Block requests to static files.
				request.abort();
			} else {
				request.continue();
			}
		});

		return { browser, page, cleanup, proxy: proxyItem };
	} catch (err) {
		logger("getPuppeteer:error", err);

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
