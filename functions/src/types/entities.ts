import type { Timestamp } from "firebase-admin/firestore";

import { eSIATypology, eSIALevel, eSIAPlace, uSIAFaculty, uSIAProgram } from "./SIA";

/**
 * Extended firebase DocumentData
 */
export interface FirebaseData extends Record<string, any> {
	/** @automated Creation date */
	createdAt?: Timestamp;
	/** @automated Last update date */
	updatedAt?: Timestamp;
}

/**
 * Firebase user
 */
export interface UserData extends FirebaseData {
	uid: string;
	name?: string | null;
	email?: string | null;
	photoURL?: string | null;
	role?: number | null;
	isAnonymous?: boolean | null;
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
	// api, flexible if endpoints do change
	siaUrl?: string;
	coursesPath?: string;
}

export interface TeacherData extends FirebaseData {
	name?: string;
	courses?: string[];
	/** @search */
	indexes?: string[];
}

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
	schedule?: [string?, string?, string?, string?, string?, string?, string?];
	teachers?: string[];
	/**
	 * Activity name.
	 * @example "CLASE TEORICA 2015162 (2015162)"
	 */
	activity?: string;
	programs?: uSIAProgram[];
	availableSpots?: number;
	classrooms?: string[];
	/**
	 * Period.
	 * @example "07/10/24-03/02/25"
	 */
	period?: string;
}

/**
 * Interface representing a SIA Course data.
 */
export interface CourseData extends FirebaseData {
	/** Unique SIA id */
	SIA?: number;
	name?: string;
	/**
	 * Used as firebase id
	 */
	code?: string;
	credits?: number;
	typology?: eSIATypology;
	level?: eSIALevel;
	place?: eSIAPlace;
	faculty?: uSIAFaculty;
	program?: uSIAProgram;
	groups?: GroupData[];
	/** @search */
	indexes?: string[];
	/** @automation */
	groupCount?: number;
	/** @automation */
	spotsCount?: number;
}
