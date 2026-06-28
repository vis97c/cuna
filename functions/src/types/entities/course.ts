import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { eSIALevel, eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "../SIA/index.js";
import type { TeacherData } from "./teacher.js";
import type { LogData } from "./log.js";
import type { SearchData } from "./base.js";
import type { AuditData } from "./member.js";

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
export interface CourseData extends SearchData {
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
 * Diferentiated by program and typology
 */
export interface GroupData extends AuditData {
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
	/** Program */
	program?: uSIAProgram;
	/** Typology */
	typology?: eSIATypology;
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
