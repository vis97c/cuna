import type { Timestamp } from "firebase-admin/firestore";

import type { SharedData } from "@open-xamu-co/firebase-nuxt/functions";

/**
 * Note
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

/**
 * Single vote per user for a note
 *
 * @collection instance/{instanceId}/notes/{noteId}/votes/{userId}
 */
export interface NoteVoteData extends SharedData {
	/**
	 * Note vote
	 */
	vote?: 1 | 0 | -1;
	/**
	 * Vote was created by internal function
	 * A new note will have 1 upvote from the creator
	 * @automated @internal
	 */
	internal?: boolean;
}
