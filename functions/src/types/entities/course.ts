import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { FirebaseData, LogData } from "@open-xamu-co/firebase-nuxt/functions";

import type { eSIALevel, eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "../SIA";
import type { GroupData } from "./group";

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
export interface CourseData extends FirebaseData {
	/**
	 * Unique SIA id
	 *
	 * @deprecated
	 */
	SIA?: number;
	/** Explorer V1 unique id */
	ExplorerV1Id?: number;
	/** Explorer V2 unique id */
	ExplorerV2Id?: string;
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
	/** Main faculty */
	faculty?: uSIAFaculty;
	/** Multiple faculties for the same course */
	faculties?: uSIAFaculty[];
	/** Multiple programs for the same course */
	programs?: uSIAProgram[];
	groups?: GroupData[];
	/**
	 * For non reported groups
	 * SIA Beta update delay
	 */
	unreported?: GroupData[];
	/** @automation */
	losEstudiantesCode?: string;
	/** @search */
	indexes?: string[];
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
	groupCount?: number;
	/**
	 * Available spots within all groups
	 * @automation
	 */
	spotsCount?: number;
	/** @automated Last scrape date */
	scrapedAt?: Timestamp;
	/** @automated Last scrape date with errors */
	scrapedWithErrorsAt?: Timestamp;
	/**
	 * Scrapper was able to get the course with this info
	 * @automation
	 */
	lastScrapedWith?: ScrapedWith;
}
