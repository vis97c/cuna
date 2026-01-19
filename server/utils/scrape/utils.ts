import { type Browser, Page, launch } from "puppeteer";
import { DocumentReference } from "firebase-admin/firestore";

import type { CachedH3Event, H3Context } from "@open-xamu-co/firebase-nuxt/server";
import type { iSelectOption } from "@open-xamu-co/ui-common-types";

import type { ExtendedInstanceData } from "~~/functions/src/types/entities";
import { eSIATypology } from "~~/functions/src/types/SIA";
import type { ExtendedInstance } from "~/utils/types/entities";

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

export async function getPuppeteer(debug?: boolean) {
	// Setup puppeteer
	const browser: Browser = await launch({
		headless: !debug,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--disable-gpu",
		],
	});
	const page: Page = await browser.newPage();

	/**
	 * Show puppet page logs
	 * @see https://stackoverflow.com/a/59919144/3304008
	 */
	if (debug) {
		page.on("console", (message) =>
			console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
		)
			.on("pageerror", ({ message }) => console.log(message))
			.on("response", (response) => console.log(`${response.status()} ${response.url()}`))
			.on("requestfailed", (request) =>
				console.log(`${request.failure()?.errorText} ${request.url()}`)
			);
	}

	return { browser, page };
}
