import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { LogData, SharedData } from "@open-xamu-co/firebase-nuxt/functions";

import type { eSIALevel, eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "../SIA";
import type { TeacherData } from "./teacher";

/**
 * Scraped with info
 */
export type ScrapedWith = [
	eSIALevel,
	eSIAPlace,
	uSIAFaculty?,
	uSIAProgram?,
	eSIATypology?,
	uSIAProgram?, // LE program
];

/**
 * Firebase course log
 *
 * @collection
 */
export interface CourseLogData extends LogData {
	courseRef?: DocumentReference<CourseData>;
}

/**
 * Interface representing a SIA Course data.
 *
 * Why number records?
 * @see https://stackoverflow.com/a/52969138
 */
export interface CourseData extends SharedData {
	name?: string;
	description?: string;
	alternativeNames?: string[];
	/** Used as firebase id */
	code?: string;
	credits?: number;
	/** Multiple typologies for the same course */
	typologies?: eSIATypology[];
	level?: eSIALevel;
	place?: eSIAPlace;
	/** Multiple faculties for the same course */
	faculties?: uSIAFaculty[];
	/** Multiple programs for the same course */
	programs?: uSIAProgram[];
	/** @automation */
	losEstudiantesCode?: string;
	/**
	 * Soundex indexes, used for search
	 * @automation @search
	 * @example ["A160", "A162", "H200", "H230", "A162 E000"]
	 */
	indexes?: string[];
	/**
	 * Weighted indexes, used for search ranking
	 * @automation @search
	 * @example ["0:A160", "1:A162", "1:H200", "2:H230", "3:A162 E000"]
	 */
	indexesWeights?: string[];
	/**
	 * Array as object to be searcheable
	 * @search
	 * @automation
	 */
	programsIndexes?: Record<number, uSIAProgram>;
	/**
	 * Array as object to be searcheable
	 * @search
	 * @automation
	 */
	typologiesIndexes?: Record<number, eSIATypology>;
	/** @automation */
	logs?: number;
	/** @automation */
	groupCount?: number;
	/**
	 * Available spots within all groups
	 * @automation
	 */
	spotsCount?: number;
	/** @automated Last scrape date */
	scrapedAt?: Timestamp;
	/**
	 * Scrapper was able to get the course with this info
	 * @automation
	 */
	scrapedWith?: ScrapedWith;
}

export type tWeeklySchedule = [string?, string?, string?, string?, string?, string?, string?];

/**
 * Interface representing a SIA Group data.
 */
export interface GroupData extends SharedData {
	name?: string;
	/** Total number of available spots. */
	spots?: number;
	/** Schedule for each day of the week */
	schedule?: tWeeklySchedule;
	teachersRefs?: DocumentReference<TeacherData>[];
	/**
	 * Activity name.
	 * @example "CLASE TEORICA 2015162 (2015162)"
	 */
	activity?: string;
	classrooms?: string[];
	/** Related course code */
	courseCode?: string;
	/** Related course name */
	courseName?: string;
	/**
	 * Academic period start date
	 */
	periodStartAt?: Timestamp;
	/**
	 * Academic period end date
	 */
	periodEndAt?: Timestamp;
	/** @automation Remaining spots. */
	availableSpots?: number;
	/** @automated Last scrape date */
	scrapedAt?: Timestamp;
}
