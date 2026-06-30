import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export type FirebaseValues<T extends FirebaseData> = { [K in keyof T]?: T[K] | FieldValue };

/**
 * Extended firebase DocumentData
 *
 * @abstract
 */
export interface FirebaseData extends Record<string, any> {
	/** @automated Creation date */
	createdAt?: Timestamp;
	/** @automated Last update date */
	updatedAt?: Timestamp;
	/**
	 * Lock document & prevent deletion
	 * A boolean or an array of reference paths locking the document
	 *
	 * @automated
	 */
	lock?: boolean | string[];
}

/**
 * Allow entity to be searchable
 *
 * @abstract
 */
export interface SearchData extends FirebaseData {
	name?: string;
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
	/** @automated unique slug */
	slug?: string;
}
