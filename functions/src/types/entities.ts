import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { eSIATypology, eSIALevel, eSIAPlace, uSIAFaculty, uSIAProgram } from "./SIA";

/**
 * Extended firebase DocumentData
 */
export interface FirebaseData extends Record<string, any> {
	/** @automated Creation date */
	createdAt?: Timestamp;
	/** @automated Last update date */
	updatedAt?: Timestamp;
	/** @automated Created by */
	createdByRef?: DocumentReference<UserData>;
	/** @automated Updated by */
	updatedByRef?: DocumentReference<UserData>;
}

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
 * Firebase log
 *
 * @collection
 */
export interface LogData extends FirebaseData {
	at?: string;
	code?: string;
	message?: string;
	error?: string;
}

/**
 * Firebase course log
 *
 * @collection
 */
export interface CourseLogData extends LogData {
	courseRef?: DocumentReference<CourseData>;
}

export interface EnrolledGroup extends Pick<GroupData, "name" | "schedule" | "teachers"> {
	courseId: string;
	courseCode: string;
	courseName: string;
}

/**
 * Firebase user
 */
export interface UserData extends FirebaseData {
	uid?: string;
	name?: string | null;
	email?: string | null;
	photoURL?: string | null;
	role?: number;
	isAnonymous?: boolean | null;
	/**
	 * Enrolled courses (codes)
	 */
	enrolled?: Record<string, EnrolledGroup>;
}

export interface InstanceConfig<T> {
	/** Cuna version */
	version?: string;
	/**
	 * Bloquear la navegacion con un mensaje
	 */
	maintenanceMessage?: string;
	/**
	 * SIA under maintenance till
	 */
	siaMaintenanceTillAt?: T;
	/**
	 * @example https://bobt42d1b3.execute-api.us-east-1.amazonaws.com/api/v1
	 */
	siaCoursesURL?: string;
	/**
	 * @example /buscadorcursos/busqueda/primernivel2
	 */
	siaCoursesPath?: string;
	/**
	 * Number of minutes before refreshing a course
	 */
	coursesRefreshRate?: number;
	/**
	 * Number of minutes before scraping a course
	 */
	coursesScrapeRate?: number;
	/**
	 * @example https://sia.unal.edu.co
	 */
	siaOldURL?: string;
	/**
	 * @example /Catalogo/facespublico/public/servicioPublico.jsf
	 */
	siaOldPath?: string;
	/**
	 * @example ?taskflowId=task-flow-AC_CatalogoAsignaturas
	 */
	siaOldQuery?: string;
	/**
	 * @example https://losestudiantes.com
	 */
	losEstudiantesUrl?: string;
	/**
	 * @example /universidad-nacional/courses
	 */
	losEstudiantesCoursesPath?: string;
	/**
	 * @example /universidad-nacional/professors
	 */
	losEstudiantesProfessorsPath?: string;
	siaOldLevel?: Record<eSIALevel, `${number}`>;
	siaOldPlace?: Record<eSIAPlace, `${number}`>;
	/**
	 * Strings because numbers are being rotated daily
	 */
	siaOldTypology?: Record<eSIATypology, string>;
}

/**
 * App instance
 */
export interface InstanceData extends FirebaseData {
	// details
	name?: string;
	url?: string;
	banner?: { message?: string; url?: string };
	// contact
	whatsappNumber?: string;
	whatsappIndicative?: `${string}+${number}`;
	// socials
	tiktokId?: string;
	twitterId?: string;
	instagramId?: string;
	facebookId?: string;
	/**
	 * Api, flexible if endpoints do change
	 */
	config?: InstanceConfig<Timestamp>;
	/**
	 * Feature flags
	 */
	flags?: {
		/**
		 * User can track courses in realtime
		 */
		trackCourses?: boolean;
	};
}

export interface TeacherData extends FirebaseData {
	name?: string;
	courses?: string[];
	/** @automation */
	losEstudiantesSlug?: string;
	/** @search */
	indexes?: string[];
}

export type tWeeklySchedule = [string?, string?, string?, string?, string?, string?, string?];

/**
 * Interface representing a SIA Group data.
 */
export interface GroupData {
	/** Unique SIA id */
	SIA?: number;
	name?: string;
	/** Total number of available spots. */
	spots?: number;
	/** Schedule for each day of the week */
	schedule?: tWeeklySchedule;
	teachers?: string[];
	/**
	 * Activity name.
	 * @example "CLASE TEORICA 2015162 (2015162)"
	 */
	activity?: string;
	availableSpots?: number;
	classrooms?: string[];
	/**
	 * Period.
	 * @example "07/10/24-03/02/25"
	 */
	period?: string;
	programs?: uSIAProgram[];
}

/**
 * Interface representing a SIA Course data.
 *
 * Why number records?
 * @see https://stackoverflow.com/a/52969138
 */
export interface CourseData extends FirebaseData {
	/** Unique SIA id */
	SIA?: number;
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
