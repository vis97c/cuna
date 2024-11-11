import fs from "node:fs";
import path from "node:path";

import locale from "@open-xamu-co/ui-common-helpers/es";

import {
	debugCSS,
	debugNuxt,
	debugHTTPS,
	production,
	runtimeConfig,
	countriesUrl,
} from "./resources/utils/enviroment";

/**
 * Preload stylesheet and once loaded call them
 * @param {string} href - Resource url
 * @returns {object} Link object
 */
function getStyleSheetPreload(href: string) {
	return {
		rel: "preload",
		as: "style" as const,
		onload: "this.onload=null;this.rel='stylesheet'",
		href,
	};
}

const loaderCss = fs.readFileSync(path.resolve(__dirname, "assets/css/loader.css"), {
	encoding: "utf8",
});
const css = ["@/assets/scss/base.scss"];
const stylesheets: string[] = [
	"https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap",
	"https://unpkg.com/@fortawesome/fontawesome-free@^6/css/all.min.css",
	"https://unpkg.com/sweetalert2@^11/dist/sweetalert2.min.css",
];
const keywords =
	"Visor de cupos UNAL, Cursos disponibles UNAL, Matrícula UNAL, Herramienta de búsqueda de cursos, Seguimiento de cupos UNAL, Estudiantes Universidad Nacional, Disponibilidad de cursos UNAL, Cuna UNAL, Plataforma de matrícula UNAL";
const description =
	"Cuna es una herramienta para que busques los cursos de la UNAL fácilmente. Consulta la disponibilidad de materias y los cupos disponibles durante la matrícula. ¡No te quedes sin cupo!";

// compile on runtime when debuggin CSS
debugCSS ? css.push("@/assets/scss/vendor.scss") : stylesheets.push("/dist/vendor.min.css?k=1");

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: debugNuxt, timeline: { enabled: debugNuxt } },
	experimental: { viewTransition: true },
	app: {
		keepalive: true,
		pageTransition: { name: "page", mode: "out-in" },
		layoutTransition: { name: "layout", mode: "out-in" },
		head: {
			htmlAttrs: { lang: "es" },
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "description", content: description },
				{ name: "keywords", content: keywords },
				{ property: "og:title", content: "Cuna ⋅ Visor de cupos UNAL." },
				{ property: "og:description", content: description },
				{ property: "og:image", content: "/images/seo.jpg" },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: "https://cuna.com.co/" },
				{ property: "og:site_name", content: "Cuna" },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: "Cuna ⋅ Visor de cupos UNAL." },
				{ name: "twitter:description", content: description },
				{ name: "twitter:image", content: "/images/seo.jpg" },
			],
			link: [
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{ rel: "canonical", href: "https://cuna.com.co/" },
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
			style: [{ textContent: loaderCss }],
			noscript: [{ textContent: "This app requires javascript to work" }],
		},
	},
	devServer: {
		https: debugHTTPS && {
			key: "server.key",
			cert: "server.crt",
		},
	},
	runtimeConfig,
	nitro: {
		preset: "firebase",
		firebase: {
			gen: 2,
			httpsOptions: {
				region: "us-east1",
				maxInstances: 3,
				enforceAppCheck: true,
			},
		},
		compressPublicAssets: true,
	},
	routeRules: {
		"/cursos/**": {
			ssr: false,
		},
	},
	vite: {
		resolve: { preserveSymlinks: true },
		css: {
			postcss: require("@open-xamu-co/ui-styles/postcss")[
				production ? "production" : "development"
			],
		},
	},
	router: {
		options: {
			linkActiveClass: "is--route",
			linkExactActiveClass: "is--routeExact",
			scrollBehaviorType: "smooth",
		},
	},
	/** Global CSS */
	css,
	modules: [
		"@nuxt/scripts",
		"@pinia/nuxt",
		"@pinia-plugin-persistedstate/nuxt",
		"@open-xamu-co/ui-nuxt",
	],
	piniaPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
			maxAge: 365 * 24 * 60 * 60,
			secure: production,
		},
		storage: "cookies",
	},
	xamu: {
		locale,
		lang: "es",
		country: "co",
		countriesUrl,
		swal: {
			overrides: {
				customClass: {
					confirmButton: ["bttn"],
					cancelButton: ["bttnToggle"],
					denyButton: ["link"],
				},
			},
			preventOverrides: {
				customClass: {
					confirmButton: ["bttn", "--tm-danger-light"],
					cancelButton: ["bttnToggle"],
					denyButton: ["link"],
				},
			},
		},
		image: {
			provider: "bypass",
			domains: ["firebasestorage.googleapis.com"],
			alias: { firebase: "/api/media/images" },
			presets: { avatar: { modifiers: {} } },
			providers: { bypass: { provider: "~/providers/bypass.ts" } },
		},
		imageHosts: ["lh3.googleusercontent.com"],
	},
	scripts: {
		registry: {
			googleAnalytics: { id: "G-X7H48BMMRK" },
		},
	},
});
