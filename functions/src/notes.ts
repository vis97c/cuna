import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";

import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { makeGetSlug } from "@open-xamu-co/firebase-nuxt/functions/slugs";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { encrypt } from "@open-xamu-co/firebase-nuxt/functions/encrypt";
import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";

import type { ExtendedInstanceData, NoteData, NoteVoteData } from "./types/entities";

const getNoteSlug = makeGetSlug("notes");

/**
 * Create note
 *
 * @docType instance
 * @event created
 */
export const onCreatedNote = onCreated<NoteData>(
	"instances/members/notes",
	async (created, { logger, createdAt }) => {
		const { firebaseFirestore } = getFirebase("onCreatedNote");
		const memberRef: DocumentReference<ExtendedInstanceData> | null = created.ref.parent.parent;
		const instanceRef: DocumentReference<ExtendedInstanceData> | null | undefined =
			memberRef?.parent.parent;

		try {
			if (!instanceRef || !memberRef) {
				throw new Error(`Missing instance or member at: "${created.ref.path}"`);
			}

			let {
				slug,
				name,
				keywords = name?.trim().split(" "),
				body = "",
				encodedAt,
			} = created.data();
			const newSlug = await getNoteSlug(firebaseFirestore, name);

			// Encode new unencoded body
			if (!encodedAt) {
				const instance = (await instanceRef.get()).data();
				const millis = instance?.createdAt?.toMillis(); // ToMillis for consistency

				// Encode secret using instance timestamp
				body = encrypt(body, String(millis));
				encodedAt = Timestamp.fromDate(createdAt);
			}

			const voteRef = created.ref.collection("votes").doc(getDocumentId(memberRef.path));

			// Create author vote, do not await
			voteRef.set({ vote: 1, internal: true });

			return { slug: slug || newSlug, body, encodedAt, keywords };
		} catch (err) {
			logger("functions:instances:members:onCreatedNote", err);

			throw err;
		}
	},
	{
		defaults: {
			score: 1,
			upvotes: 1, // Author upvote
			downvotes: 0,
			public: false,
			lock: false,
		},
	}
);
/**
 * Update note
 *
 * @docType instance
 * @event updated
 */
export const onUpdatedNote = onUpdated<NoteData>(
	"instances/members/notes",
	async (updated, existing, { updatedAt, logger }) => {
		const { firebaseFirestore } = getFirebase("onUpdatedNote");
		const memberRef: DocumentReference<ExtendedInstanceData> | null = updated.ref.parent.parent;
		const instanceRef: DocumentReference<ExtendedInstanceData> | null | undefined =
			memberRef?.parent.parent;

		try {
			if (!instanceRef) throw new Error(`Missing instance at: "${updated.ref.path}"`);

			const existingData = existing.data();
			let {
				slug = "",
				body = "",
				encodedAt = Timestamp.fromDate(updatedAt),
				lock,
			} = updated.data();

			// Validate slug if slug has changed
			if (existingData.slug !== slug) {
				// Update slug if unlocked
				if (!lock) slug = await getNoteSlug(firebaseFirestore, slug, existingData.slug);
			}

			// Encode updated body
			if (
				existingData.body !== body &&
				(!existingData.encodedAt || existingData.encodedAt.isEqual(encodedAt))
			) {
				const instance = (await instanceRef.get()).data();
				const millis = instance?.createdAt?.toMillis(); // ToMillis for consistency

				// Encode secret using instance timestamp
				body = encrypt(body, String(millis));
				encodedAt = Timestamp.fromDate(updatedAt);
			}

			return { slug, body, encodedAt };
		} catch (err) {
			logger("functions:instances:members:onUpdatedNote", err);

			throw err;
		}
	}
);

/**
 * Create note vote
 *
 * @docType instance
 * @event created
 */
export const onCreatedNoteVote = onCreated<NoteVoteData>(
	"instances/members/notes/votes",
	async (created, { logger }) => {
		const noteRef = created.ref.parent.parent;
		const { vote = 0, internal } = created.data();

		if (internal) return;

		try {
			// Parent note is required
			if (!noteRef) throw new Error("Missing note ref");

			// Delete invalid vote
			if (vote !== 1 && vote !== -1) throw new Error("Invalid vote");

			/** Total change in score. */
			const delta = vote;
			/** Change in upvote count. */
			const upvotesDelta = vote === 1 ? 1 : 0;
			/** Change in downvote count. */
			const downvotesDelta = vote === -1 ? 1 : 0;
			// Perform batch operations
			const voteBatch = created.ref.firestore.batch();

			// Setup transactions
			voteBatch.update(noteRef, {
				upvotes: FieldValue.increment(upvotesDelta),
				downvotes: FieldValue.increment(downvotesDelta),
				score: FieldValue.increment(delta),
			});

			// Commit batch
			await voteBatch.commit();
		} catch (err) {
			logger("functions:instances:members:onCreatedNoteVote", err);

			throw err;
		}
	},
	{
		defaults: {
			lock: true,
		},
	}
);

/**
 * Update note vote.
 * Calculate deltas & update note.
 *
 * @docType instance
 * @event updated
 */
export const onUpdatedNoteVote = onUpdated<NoteVoteData>(
	"instances/members/notes/votes",
	async (updated, existing, { logger }) => {
		const noteRef = updated.ref.parent.parent;

		try {
			// Parent note is required
			if (!noteRef) throw new Error("Missing note ref");

			const oldVote = existing.data()?.vote ?? 0;
			const vote = updated.data()?.vote ?? 0;

			// Omit if vote is the same
			if (vote === oldVote) return;

			/** Total change in score. */
			const delta = vote - oldVote;
			/** Change in upvote count. */
			const upvotesDelta = oldVote === 1 ? -1 : vote === 1 ? 1 : 0;
			/** Change in downvote count. */
			const downvotesDelta = oldVote === -1 ? -1 : vote === -1 ? 1 : 0;
			// Perform batch operations
			const voteBatch = updated.ref.firestore.batch();

			// Setup transactions
			voteBatch.update(noteRef, {
				upvotes: FieldValue.increment(upvotesDelta),
				downvotes: FieldValue.increment(downvotesDelta),
				score: FieldValue.increment(delta),
			});

			// Eliminar voto si se quitó
			if (vote === 0) voteBatch.delete(updated.ref);

			// Commit batch
			await voteBatch.commit();
		} catch (err) {
			logger("functions:instances:members:onUpdatedNoteVote", err);

			throw err;
		}
	}
);
