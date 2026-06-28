import { getAuth } from "firebase-admin/auth";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";

import {
	eMemberRole,
	type InstanceData,
	type MemberAbuseData,
	type MemberData,
} from "../types/entities/index.js";
import { getFirebase } from "../utils/firebase.js";
import { onCreated, onUpdated, onDeleted } from "../utils/event.js";
import { makeGetSlug } from "../utils/slugs.js";
import { getWeightedSearchIndexes } from "../utils/search.js";

const getMemberSlug = makeGetSlug("members");

/**
 * Create timestamp & set slug
 *
 * @docType member
 * @event created
 */
export const onCreatedMember = onCreated<MemberData>(
	"instances/members",
	async (created, { logger }) => {
		const instanceRef: DocumentReference<InstanceData> | null = created.ref.parent.parent;

		try {
			if (!instanceRef) throw new Error(`Missing instance at: "${created.ref.path}"`);

			const { slug, name = "" } = created.data();
			// Get search indexes
			const { indexes, indexesWeights } = getWeightedSearchIndexes(name);

			// Increase members count, do not await
			instanceRef.update({ membersCount: FieldValue.increment(1) });

			return {
				indexes,
				indexesWeights,
				slug: slug || (await getMemberSlug(instanceRef, name)),
			};
		} catch (err) {
			logger("functions:instances:onCreatedMember", err);

			throw err;
		}
	},
	{
		defaults: {
			description: "",
			locationCountry: "CO",
			locationState: "",
			locationCity: "",
			level: 1,
			role: eMemberRole.GUEST,
			lock: true,
			bannedUntilAt: false,
			requestedDeletionAt: false,
			// Auth platform
			isAnonymous: false,
			emailVerified: false,
			// Mentor only
			academicTitle: false,
			academicField: false,
		},
	}
);
/**
 * Update timestamp & slug conditionally
 *
 * @docType member
 * @event updated
 */
export const onUpdatedMember = onUpdated<MemberData>(
	"instances/members",
	async (updated, existing, { logger }) => {
		const instanceRef: DocumentReference<InstanceData> | null = updated.ref.parent.parent;

		try {
			if (!instanceRef) throw new Error(`Missing instance at: "${updated.ref.path}"`);

			const existingData = existing.data();
			let { slug, name = "", lock, indexes, indexesWeights } = updated.data();

			// Conditionally update slug
			if (
				(!slug && name) ||
				(existingData.slug === slug && existingData.name !== name && !lock)
			) {
				slug = await getMemberSlug(instanceRef, name, existingData.slug);
			}

			// Get fresh search indexes
			if (existingData.name !== name) {
				const updatedIndexes = getWeightedSearchIndexes(name);

				indexes = updatedIndexes.indexes;
				indexesWeights = updatedIndexes.indexesWeights;
			}

			return { slug, indexes, indexesWeights };
		} catch (err) {
			logger("functions:instances:onUpdatedMember", err);

			throw err;
		}
	}
);
/**
 * Remove auth if user is removed
 * Ideally this should never be triggered
 *
 * @docType member
 * @event deleted
 */
export const onDeletedMember = onDeleted<MemberData>(
	"instances/members",
	async (deletedDoc, { logger }) => {
		const { firebaseFirestore } = getFirebase("onDeletedMember");

		const instanceRef: DocumentReference<InstanceData> | null = deletedDoc.ref.parent.parent;

		try {
			if (!instanceRef) throw new Error(`Missing instance at: "${deletedDoc.ref.path}"`);

			const { uid = "" } = deletedDoc.data();

			// Decrease members count, do not await
			instanceRef.update({ membersCount: FieldValue.increment(-1) });

			// Count if present in other instances
			const membersQuery = firebaseFirestore
				.collectionGroup("members")
				.where("uid", "==", uid);
			const membersAggregator = membersQuery.count();
			const { data } = await membersAggregator.get();
			const appearancesCount = data().count;

			// Bypass auth deletion if present in more than one instance
			if (appearancesCount > 1) return;

			// Delete auth
			return getAuth().deleteUser(uid);
		} catch (err) {
			logger("functions:users:onDeletedUser", err);

			throw err;
		}
	}
);

/**
 * Create timestamp
 *
 * @docType memberAbuse
 * @event created
 */
export const onCreatedMemberAbuse = onCreated<MemberAbuseData>(
	"instances/members/abuses",
	undefined,
	{
		defaults: {
			at: "",
			message: "",
			lock: false,
		},
	}
);
/**
 * Update timestamp
 *
 * @docType memberAbuse
 * @event updated
 */
export const onUpdatedMemberAbuse = onUpdated<MemberAbuseData>("instances/members/abuses");

// DELETE ALL FUNCTIONS COMMAND
// firebase functions:delete onCreatedMember onUpdatedMember onDeletedMember --force
// firebase functions:delete onCreatedMemberAbuse onUpdatedMemberAbuse --force
