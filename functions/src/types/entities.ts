import type { Timestamp } from "firebase-admin/firestore";

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
}
