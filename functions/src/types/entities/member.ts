import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { FirebaseData, SearchData } from "./base.js";
import type { GroupData } from "./course.js";

export enum eIdDocumentType {
	/** Cédula de ciudadanía */
	CC = "CC",
	/** Cédula de extranjería */
	CE = "CE",
	/** Pasaporte */
	PA = "PA",
	/** Tarjeta de identidad */
	TI = "TI",
	/** Numero de identificación tributario */
	NIT = "NIT",
}

export enum eMemberRole {
	/** Developer */
	DEVELOPER = -1,
	/** Admin */
	ADMIN = 0,
	/** Editor */
	EDITOR = 1,
	/** Moderator */
	MODERATOR = 2,
	/** Guest */
	GUEST = 3,
}

/**
 * Document can be modified by any user
 *
 * This data is used to keep track of the changes
 */
export interface AuditData extends FirebaseData {
	createdByRef?: DocumentReference<MemberData>;
	updatedByRef?: DocumentReference<MemberData>;
	deletedByRef?: DocumentReference<MemberData>;
}

/**
 * Instance member
 *
 * @id Same as Google auth platform uid
 * @collection instances/{instanceId}/members
 */
export interface MemberData extends AuditData, SearchData {
	// Auth platform data
	uid?: string;
	photoURL?: string | null;
	isAnonymous?: boolean | null;
	emailVerified?: boolean | null;
	/** @deprecated Get email from auth platform instead */
	email?: string | null;
	/** Member bio */
	description?: string;
	// Location data
	locationCity?: string;
	locationState?: string;
	locationCountry?: string;
	zip?: string;
	address?: string;
	// Character data
	role?: eMemberRole;
	// Behavior data
	/** @automated Member is banned until given date */
	bannedUntilAt?: false | Timestamp;
	/**
	 * Enrolled courses (codes)
	 */
	enrolledRefs?: DocumentReference<GroupData>[];
}

/**
 * Store abuse
 * Keep track of abussive behavior by users
 *
 * This should not represent a ban, userData.bannedUntilAt should do that
 *
 * @id auto-generated
 * @collection instances/{instanceId}/members/{memberId}/abuses
 */
export interface MemberAbuseData extends AuditData {
	name?: string;
	description?: string;
}
