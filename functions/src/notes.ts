import { Timestamp, type DocumentReference } from "firebase-admin/firestore";

import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { makeGetSlug } from "@open-xamu-co/firebase-nuxt/functions/slugs";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { encrypt } from "@open-xamu-co/firebase-nuxt/functions/encrypt";

import type { ExtendedInstanceData, NoteData } from "./types/entities";

const getNoteSlug = makeGetSlug("notes");

// Notes timestamp
export const onCreatedNote = onCreated<NoteData>(
	"instances/members/notes",
	async (created, { logger, createdAt }) => {
		const { firebaseFirestore } = getFirebase("onCreatedNote");
		const memberRef: DocumentReference<ExtendedInstanceData> | null = created.ref.parent.parent;
		const instanceRef: DocumentReference<ExtendedInstanceData> | null | undefined =
			memberRef?.parent.parent;

		try {
			if (!instanceRef) throw new Error(`Missing instance at: "${created.ref.path}"`);

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

			return { slug: slug || newSlug, body, encodedAt, keywords };
		} catch (err) {
			logger("functions:instances:members:onCreatedNote", err);

			throw err;
		}
	},
	{
		defaults: {
			public: false,
			score: 1,
			upvotes: 1, // Author upvote
			downvotes: 0,
			lock: false,
		},
	}
);
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
