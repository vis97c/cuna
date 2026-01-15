import fs from "node:fs";
import path from "node:path";

import type { H3Context } from "@open-xamu-co/firebase-nuxt/server";
import {
	debugCSS,
	debugNuxt,
	production,
	firebaseConfig,
} from "@open-xamu-co/firebase-nuxt/server/environment";
import { type Stylesheet, getStyleSheetPreload } from "@open-xamu-co/ui-nuxt";

import { debugHTTPS } from "./server/utils/enviroment";
import packageJson from "./package.json" assert { type: "json" };

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

// Metadata
const withResolutions = "resolutions" in packageJson && debugNuxt.value();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-03-02",
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
	devServer: { https: debugHTTPS.value() && { key: "server.key", cert: "server.crt" } },
	runtimeConfig: {
		public: {
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
		server: { fs: { strict: !withResolutions } },
	},
	nitro: {
		preset: "firebase_app_hosting",
		routeRules: {
			// Support firebase auth proxy for signing with redirect
			"/__/**": {
				proxy: `https://${firebaseConfig.value().projectId}.firebaseapp.com/__/**`,
			},
			// Delete instance cache
			"/api/instance": {
				csurf: { methodsToProtect: ["DELETE"] },
			},
			// Redirect cursos to / (Old landing page)
			"/cursos": {
				redirect: "/",
			},
		},
		rollupConfig: {
			external: withResolutions
				? [
						"firebase-admin/app",
						"firebase-admin/firestore",
						"firebase-admin/auth",
						"firebase-admin/storage",
					]
				: undefined,
		},
	},
	/** Global CSS */
	css,
	modules: ["@open-xamu-co/firebase-nuxt", "@nuxt/scripts"],
	firebaseNuxt: {
		readCollection: (collectionId: string, { currentAuth }: H3Context) => {
			/** Freely listable collections */
			const listableCollections = ["courses"];

			// Auth, Allow listing if admin or above
			if (currentAuth && currentAuth.role <= -1) {
				listableCollections.push("logs", "instances", "offenders");
			}

			return listableCollections.includes(collectionId);
		},
		readInstanceCollection: (collectionId: string, { currentAuth }: H3Context) => {
			/** Freely listable collections */
			const listableCollections = [];

			// Auth, allow listing if admin or above
			if (currentAuth && currentAuth.role <= -1) {
				listableCollections.push("logs");
			}

			return listableCollections.includes(collectionId);
		},
	},
	scripts: {
		registry: { googleAnalytics: { id: firebaseConfig.value().measurementId } },
	},
});
