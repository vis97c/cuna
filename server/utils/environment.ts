import {
	defineString,
	defineBoolean,
	type BooleanParam,
	defineInt,
	type IntParam,
} from "firebase-functions/params";

import type { FirebaseOptions } from "firebase/app";

import { eCacheControl } from "../../functions/src/types/enums";
import { forcedInstanceId } from "../../functions/src/utils/environment";

/**
 * Public runtime config
 */
export interface FirebaseNuxtPublicRuntimeConfig {
	// App
	appName: string;
	production: boolean;
	forcedInstanceId: string;
	indexable: boolean;
	tenants: boolean;
	// Firebase
	firebaseConfig: Required<Omit<FirebaseOptions, "databaseURL" | "recaptchaSiteKey">>;
	recaptchaEnterpriseKey: string;
	debugAppCheck: boolean;
	debugFirebase: boolean;
	countriesUrl: string;
	// Utils
	cache: {
		none: eCacheControl;
		frequent: eCacheControl;
		normal: eCacheControl;
		midterm: eCacheControl;
		longterm: eCacheControl;
	};
}

const environment = defineString("NODE_ENV", { default: "development" });

// Project
export const port: Pick<IntParam, "value"> = {
	value: () => defineInt("PORT", { default: 3000 }).value() || 3000,
};
export const production: { value(): boolean } = environment.equals("production");
export const indexable = defineBoolean("INDEXABLE", { default: false });
export const origin = defineString("ORIGIN");
export const countriesUrl = defineString("COUNTRIES_API");
export const appName = defineString("APP_NAME");
export const siaUrl = defineString("SIA_API");

// Debug
export const debugNuxt: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_NUXT", { default: false }).value(),
};
export const debugNitro: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_NITRO", { default: false }).value(),
};
export const debugCSS: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_CSS", { default: false }).value(),
};
export const debugAppCheck: Pick<BooleanParam, "value"> = {
	value: () =>
		!production.value() && defineBoolean("DEBUG_APP_CHECK", { default: false }).value(),
};
export const debugFirebase: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_FIREBASE", { default: false }).value(),
};
export const debugHTTPS: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_HTTPS", { default: false }).value(),
};
export const debugScrapper: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_SCRAPPER", { default: false }).value(),
};

// Firebase
export const storageBucket = defineString("F_STORAGE_BUCKET");
// Service account
export const projectId = defineString("F_PROJECT_ID");
export const privateKey = defineString("F_PRIVATE_KEY");
export const clientEmail = defineString("F_CLIENT_EMAIL");
/** App check, public key */
export const recaptchaEnterpriseKey = defineString("RECAPTCHA_ENTERPRISE_SITE_KEY");

/**
 * Firebase client data
 */
export const firebaseConfig = {
	value(): FirebaseNuxtPublicRuntimeConfig["firebaseConfig"] {
		return {
			projectId: projectId.value(),
			apiKey: defineString("F_API_KEY").value(),
			authDomain: defineString("F_AUTH_DOMAIN").value(),
			storageBucket: storageBucket.value(),
			messagingSenderId: defineString("F_MESSAGING_SENDER_ID").value(),
			appId: defineString("F_APP_ID").value(),
			measurementId: defineString("F_MEASUREMENT_ID").value(),
		};
	},
};

/**
 * CSurf encryption secret
 * Required for CSRF protected routes
 */
export const csurfSecret = defineString("CSURF_SECRET");

/**
 * Public runtime config
 */
export const publicRuntimeConfig = {
	value(): FirebaseNuxtPublicRuntimeConfig {
		return {
			// App
			appName: appName.value(),
			production: production.value(),
			forcedInstanceId: forcedInstanceId.value(),
			indexable: indexable.value(),
			// Firebase
			firebaseConfig: firebaseConfig.value(),
			recaptchaEnterpriseKey: recaptchaEnterpriseKey.value(),
			debugAppCheck: debugAppCheck.value(),
			debugFirebase: debugFirebase.value(),
			countriesUrl: countriesUrl.value(),
			// Utils
			cache: {
				none: eCacheControl.NONE,
				frequent: eCacheControl.FREQUENT,
				normal: eCacheControl.NORMAL,
				midterm: eCacheControl.MIDTERM,
				longterm: eCacheControl.LONGTERM,
			},
			tenants: false,
		};
	},
};

// cloud functions url
export const cfScrapeCoursesUrl = defineString("CF_SCRAPE_COURSES_URL");
export const cfScrapeCourseGroupsUrl = defineString("CF_SCRAPE_COURSE_GROUPS_URL");
