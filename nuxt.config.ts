import fs from "node:fs";
import path from "node:path";

import { locale } from "./app/utils/locale";

import { type Stylesheet, getStyleSheetPreload } from "@open-xamu-co/ui-nuxt";

import {
	publicRuntimeConfig,
	port,
	debugCSS,
	debugNuxt,
	debugScrapper,
	debugHTTPS,
	cfScrapeCoursesUrl,
	cfScrapeCourseGroupsUrl,
	production,
	firebaseConfig,
} from "./server/utils/environment";
import packageJson from "./package.json" with { type: "json" };

const loaderCss = fs.readFileSync(path.resolve(__dirname, "app/assets/loader.css"), {
	encoding: "utf8",
});
const css = [];
const stylesheets: Stylesheet[] = [
	"https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap",
	"https://unpkg.com/@fortawesome/fontawesome-free@^6/css/all.min.css",
	"https://unpkg.com/sweetalert2@^11/dist/sweetalert2.min.css",
];

// compile on runtime when debuggin CSS
debugCSS.value() ? css.push("assets/vendor.scss") : stylesheets.push("/dist/vendor.min.css?k=1");

const alias: Record<string, string> = {};

// Fix Vue dedupe issue when linking packages
if ("resolutions" in packageJson) {
	const componentsKey = "@open-xamu-co/ui-components-vue";
	const componentsPath = (packageJson.resolutions as any)[componentsKey];

	if (componentsPath) {
		alias[componentsKey] = path.resolve(componentsPath?.replace("portal:/", ""));
	}
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-03-02",
	devtools: {
		enabled: debugNuxt.value(),
		timeline: { enabled: debugNuxt.value() },
	},
	experimental: {
		asyncContext: true,
		viewTransition: true,
	},
	// Follow nuxt 4 directory structure
	srcDir: "./app",
	serverDir: "./server",
	dir: { public: "../public" },
	app: {
		pageTransition: { name: "page", mode: "out-in" },
		layoutTransition: { name: "layout", mode: "out-in" },
		head: {
			htmlAttrs: { lang: "es" },
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "msvalidate.01", content: "BBF99508118DB02449397517DA5EAE5C" },
			],
			link: [
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{
					rel: "preconnect",
					href: "https://fonts.googleapis.com/",
					crossorigin: "anonymous",
				},
				{ rel: "dns-prefetch", href: "https://fonts.googleapis.com/" },
				{ rel: "preconnect", href: "https://unpkg.com/", crossorigin: "anonymous" },
				{ rel: "dns-prefetch", href: "https://unpkg.com/" },
				...stylesheets.map(getStyleSheetPreload),
			],
			style: [{ innerHTML: loaderCss, tagPriority: 0 }],
			noscript: [{ innerHTML: "This app requires javascript to work" }],
		},
	},
	devServer: {
		https: debugHTTPS.value() && { key: "server.key", cert: "server.crt" },
		host: "0.0.0.0",
		port: port.value(),
	},
	runtimeConfig: {
		debugScrapper: debugScrapper.value(),
		cfScrapeCoursesUrl: cfScrapeCoursesUrl.value(),
		cfScrapeCourseGroupsUrl: cfScrapeCourseGroupsUrl.value(),
		public: {
			...publicRuntimeConfig.value(),
			debugHTTPS: debugHTTPS.value(),
		},
	},
	vite: {
		css: {
			postcss: require("@open-xamu-co/ui-styles/postcss")[
				production.value() ? "production" : "development"
			],
			preprocessorOptions: {
				scss: {
					additionalData: `
																																																																																																																																																																																																@use "assets/overrides";
																																																																																																																																																																																																@use "@open-xamu-co/ui-styles/src/utils/module" as xamu;`,
				},
			},
		},
		server: { fs: { strict: "resolutions" in packageJson } },
	},
	nitro: {
		compressPublicAssets: true,
		preset: "firebase_app_hosting",
		routeRules: {
			// Support firebase auth proxy for signing with redirect
			"/__/**": {
				proxy: `https://${firebaseConfig.value().projectId}.firebaseapp.com/__/**`,
			},
		},
		publicAssets: [
			{
				dir: "./public",
				maxAge: 60 * 60 * 24 * 365, // 1 year
			},
		],
	},
	/** Global CSS */
	css,
	modules: ["@open-xamu-co/ui-nuxt", "@nuxt/image", "@pinia/nuxt", "@nuxt/scripts"],
	xamu: {
		locale,
		lang: "es",
		country: "CO",
		imageHosts: ["lh3.googleusercontent.com"],
		imagePlaceholder: "/sample-missing.png",
		disableCSSMeta: true,
	},
	image: {
		provider: "firebase",
		domains: ["firebasestorage.googleapis.com"],
		providers: {
			firebase: { provider: "app/providers/firebase" },
		},
	},
	scripts: {
		registry: { googleAnalytics: { id: firebaseConfig.value().measurementId } },
	},
});
