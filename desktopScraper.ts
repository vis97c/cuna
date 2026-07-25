/// <reference lib="deno.ns" />
import { default as puppeteer, type Browser } from "puppeteer-core";

import {
	parseCoursesTable,
	scrapeCoursesHandle,
	scrapeCoursesWithTypologyHandle,
} from "./functions-scrapper/src/utils/courses.ts";
import { scrapeCourseGroupsLinks } from "./functions-scrapper/src/utils/groups.ts";
import type {
	CourseGroupLink,
	CourseLink,
	iCoursesPayload,
	iGroupsPayload,
	iSIAConfig,
} from "./functions-scrapper/src/types/scrapper.ts";

export const SIA_URL =
	"https://sia.unal.edu.co/Catalogo/facespublico/public/servicioPublico.jsf?taskflowId=task-flow-AC_CatalogoAsignaturas";

async function findChromeExecutable(): Promise<string | undefined> {
	const os = Deno.build.os;
	const possiblePaths: string[] = [];

	if (os === "windows") {
		possiblePaths.push(
			"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
			"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
			"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
			"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
		);
	} else if (os === "darwin") {
		possiblePaths.push(
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			"/Applications/Chromium.app/Contents/MacOS/Chromium"
		);
	} else if (os === "linux") {
		possiblePaths.push(
			"/usr/bin/google-chrome",
			"/usr/bin/chromium-browser",
			"/usr/bin/chromium",
			"/usr/bin/microsoft-edge-stable"
		);
	}

	for (const p of possiblePaths) {
		try {
			const stat = await Deno.stat(p);

			if (stat.isFile) return p;
		} catch {
			// ignore missing paths
		}
	}

	return undefined;
}

export async function launchBrowser(): Promise<{ browser: Browser; executablePath?: string }> {
	const executablePath = await findChromeExecutable();
	const options: Record<string, any> = {
		headless: true,
		protocolTimeout: 60000,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	};

	if (executablePath) {
		options.executablePath = executablePath;
	}

	const browser = await puppeteer.launch(options);

	return { browser, executablePath };
}

export async function scrapeCoursesLocal(
	payload: iCoursesPayload,
	config: iSIAConfig = {}
): Promise<CourseLink[]> {
	const { browser } = await launchBrowser();

	try {
		const page = await browser.newPage();
		const targetUrl = config.siaOldURL || SIA_URL;

		await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

		let coursesHandle = await scrapeCoursesHandle(config, page as any, payload);

		if (payload.typology) {
			coursesHandle = await scrapeCoursesWithTypologyHandle(config, page as any, payload);
		}

		return await parseCoursesTable(coursesHandle);
	} finally {
		await browser.close();
	}
}

export async function scrapeCourseGroupsLocal(
	payload: iGroupsPayload,
	config: iSIAConfig = {}
): Promise<{ links: CourseGroupLink[]; errors: any[] }> {
	const { browser } = await launchBrowser();

	try {
		const page = await browser.newPage();
		const targetUrl = config.siaOldURL || SIA_URL;

		await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

		return await scrapeCourseGroupsLinks(config, page as any, payload);
	} finally {
		await browser.close();
	}
}
