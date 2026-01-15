import type { DocumentReference, FieldValue } from "firebase/firestore";
import type { FirebaseDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { Group } from "./group";
import type { CourseData, CourseLogData } from "~~/functions/src/types/entities";

/**
 * Firebase course log
 */
export interface CourseLog extends FirebaseDocument, FromData<CourseLogData> {
	course?: Course;
}
/** This one goes to the database */
export interface CourseLogRef extends GetRef<CourseLog> {
	courseRef?: DocumentReference | FieldValue;
}

/**
 * SIA Course
 */
export interface Course extends FirebaseDocument, FromData<CourseData> {
	groups?: Group[];
	unreported?: Group[];
	/** @automated Last scrape date */
	scrapedAt?: string | Date;
}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface CourseRef extends GetRef<Course, "scrapedAt"> {
	/** @automated Last scrape date */
	scrapedAt?: Date;
}
