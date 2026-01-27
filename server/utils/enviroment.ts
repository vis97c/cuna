import { defineString, defineBoolean, type BooleanParam } from "firebase-functions/params";

import { production } from "@open-xamu-co/firebase-nuxt/server/environment";

/**
 * CSurf encryption secret
 * Required for CSRF protected routes
 */
export const csurfSecret = defineString("CSURF_SECRET");

// cloud functions url
export const cfScrapeCoursesUrl = defineString("CF_SCRAPE_COURSES_URL");
export const cfScrapeCourseGroupsUrl = defineString("CF_SCRAPE_COURSE_GROUPS_URL");

// project
export const siaUrl = defineString("SIA_API");

// debug
export const debugHTTPS: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_HTTPS", { default: false }).value(),
};
export const debugFirebase: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_FIREBASE", { default: false }).value(),
};
export const debugScrapper: Pick<BooleanParam, "value"> = {
	value: () => !production.value() && defineBoolean("DEBUG_SCRAPPER", { default: false }).value(),
};
