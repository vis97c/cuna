import type { FirebaseOptions } from "firebase/app";
import { defineString, defineBoolean } from "firebase-functions/params";

const environment = defineString("NODE_ENV", { default: "development" });

// project
export const production = environment.equals("production").value();
export const indexable = defineBoolean("INDEXABLE").value();
export const instance = defineString("INSTANCE").value();
export const countriesUrl = defineString("COUNTRIES_API").value();
export const siaUrl = defineString("SIA_API").value();

// debug
export const debugHTTPS = !production && defineBoolean("DEBUG_HTTPS", { default: false }).value();
export const debugNuxt = !production && defineBoolean("DEBUG_NUXT", { default: false }).value();
export const debugCSS = !production && defineBoolean("DEBUG_CSS", { default: false }).value();
export const debugAppCheck =
	!production && defineBoolean("DEBUG_APP_CHECK", { default: false }).value();
export const debugFirebase =
	!production && defineBoolean("DEBUG_FIREBASE", { default: false }).value();
export const debugScrapper =
	!production && defineBoolean("DEBUG_SCRAPPER", { default: false }).value();

// Service account
export const projectId = defineString("F_PROJECT_ID").value();
export const privateKey = defineString("F_PRIVATE_KEY").value();
export const clientEmail = defineString("F_CLIENT_EMAIL").value();

/**
 * App check, public key
 */
const recaptchaEnterpriseKey = defineString("RECAPTCHA_ENTERPRISE_SITE_KEY").value();
/**
 * Firebase client data
 */
const firebaseConfig: FirebaseOptions = {
	projectId,
	apiKey: defineString("F_API_KEY").value(),
	authDomain: defineString("F_AUTH_DOMAIN").value(),
	storageBucket: defineString("F_STORAGE_BUCKET").value(),
	messagingSenderId: defineString("F_MESSAGING_SENDER_ID").value(),
	appId: defineString("F_APP_ID").value(),
	measurementId: defineString("F_MEASUREMENT_ID").value(),
};

export const runtimeConfig = {
	public: {
		production,
		indexable,
		firebaseConfig,
		recaptchaEnterpriseKey,
		debugAppCheck,
		debugFirebase,
		debugScrapper,
		instance,
		countriesUrl,
		cache: {
			none: "no-cache, must-revalidate",
			/** Cache for a few minutes */
			frequent: "public, max-age=120, stale-while-revalidate=60",
			/** Cache for an hour */
			normal: "public, max-age=3600, must-revalidate",
			/** Cache for a month */
			midterm: "public, max-age=2592000, must-revalidate",
			/** Cache for a year */
			longterm: "public, max-age=31536000, must-revalidate",
		},
	},
};
