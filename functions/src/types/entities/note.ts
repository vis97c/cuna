import type { Timestamp } from "firebase-admin/firestore";

import type { SharedData } from "@open-xamu-co/firebase-nuxt/functions";

/**
 * Instance note
 *
 * @collection instance/notes
 */
export interface NoteData extends SharedData {
	name?: string;
	/** Markdown body */
	body?: string;
	keywords?: string[];
	/**
	 * Note can be shown in global feed
	 */
	public?: boolean;
	/** @automated unique slug */
	slug?: string;
	/** @automated Last encode date */
	encodedAt?: Timestamp;
	/**
	 * Note score (upvotes - downvotes)
	 * @automated @cached
	 */
	score?: number;
	/**
	 * Note upvotes
	 * @automated @cached
	 */
	upvotes?: number;
	/**
	 * Note downvotes
	 * @automated @cached
	 */
	downvotes?: number;
}
