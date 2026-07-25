import type { DocumentReference, Timestamp } from "firebase-admin/firestore";

import type { AuditData } from "./member.ts";
import type { InstanceData } from "./instance.ts";
import type { SearchData } from "./base.ts";

/**
 * Note
 *
 * @collection instance/notes
 */
export interface NoteData extends AuditData, SearchData {
	/** Markdown body */
	body?: string;
	keywords?: string[];
	/**
	 * Note can be shown in global feed
	 */
	public?: boolean | "UNLISTED";
	/**
	 * Score is hidden from users
	 */
	hideScore?: boolean;
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
	/**
	 * Linked notes count
	 * @automated
	 */
	linkedNotesCount?: number;
	/**
	 * Parent note reference
	 * @automation Be able to link notes
	 */
	linkedNoteRef?: DocumentReference<NoteData>;
	/**
	 * Instance reference
	 * @automation Be able to filter collectionGroups by instance
	 */
	instanceRef?: DocumentReference<InstanceData>;
}

/**
 * Single vote per user for a note
 *
 * @collection instance/{instanceId}/notes/{noteId}/votes/{userId}
 */
export interface NoteVoteData extends AuditData {
	/**
	 * Note vote
	 */
	vote?: 1 | 0 | -1;
	/**
	 * Related note reference
	 * Required for queries
	 */
	notePath?: string;
	/**
	 * Vote was created by internal function
	 * A new note will have 1 upvote from the creator
	 * @automated @internal
	 */
	internal?: boolean;
}
