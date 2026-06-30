import { FieldValue, type CollectionReference } from "firebase-admin/firestore";

import {
	type InstanceData,
	type MemberData,
	type LogData,
	eMemberRole,
} from "../types/entities/index.js";
import { getFirebase } from "../utils/firebase.js";
import { onCreated, onUpdated, onDeleted } from "../utils/event.js";
import { offenderLogger } from "../utils/logger.js";
import { makeGetSlug } from "../utils/slugs.js";

export * from "./members.js";
export * from "./teachers.js";
export * from "./notes.js";
export * from "./courses.js";

const getInstanceSlug = makeGetSlug("instances");

/**
 * Create timestamp
 *
 * @docType instance
 * @event created
 */
export const onCreatedInstance = onCreated<InstanceData>(
	"instances",
	async (created, { logger }) => {
		const instanceRef = created.ref;
		const membersRef: CollectionReference<MemberData> = instanceRef.collection("members");
		const { firebaseFirestore } = getFirebase("onCreatedInstance");

		try {
			const { createdByRef, slug, name = "" } = created.data();

			if (createdByRef) {
				const ownedByRef = membersRef.doc(createdByRef.id);

				// Get current role to prevent override
				const ownedByData = (await ownedByRef.get()).data();
				const { role = eMemberRole.ADMIN } = ownedByData || {};

				// Set owner role, do not await
				ownedByRef.set({ role: Math.min(role, eMemberRole.ADMIN) });
			}

			const newSlug = await getInstanceSlug(firebaseFirestore, slug || name);

			return { slug: newSlug, ownedByRef: createdByRef };
		} catch (err) {
			logger("functions:instances:onCreatedInstance", err);

			throw err;
		}
	},
	{
		defaults: {
			disabledAt: false,
			locationCountry: "CO",
			locationState: "VAC",
			locationCity: "Cali",
			zip: "",
			address: "",
			whatsappIndicative: "CO+57",
			whatsappNumber: "",
			whatsappText: "Hola, me comunico con ustedes por que...",
			banner: { message: "Bienvenidx a mi plataforma" },
			lock: true, // Prevent instance from being deleted
		},
	}
);
/**
 * Update timestamp
 *
 * @docType instance
 * @event updated
 */
export const onUpdatedInstance = onUpdated<InstanceData>(
	"instances",
	async (updated, existing, { logger }) => {
		const { firebaseFirestore } = getFirebase("onUpdatedInstance");

		try {
			const existingData = existing.data();
			let { slug, name = "", lock } = updated.data();

			// Conditionally update slug
			if (
				(!slug && name) ||
				(existingData.slug === slug && existingData.name !== name && !lock)
			) {
				slug = await getInstanceSlug(firebaseFirestore, name, existingData.slug);
			}

			return { slug };
		} catch (err) {
			logger("functions:instances:onUpdatedInstance", err);

			throw err;
		}
	}
);

/**
 * Create timestamp
 *
 * @docType instanceLog
 * @event created
 */
export const onCreatedInstanceLog = onCreated<LogData>(
	"instances/logs",
	(createdDoc) => {
		const { firebaseFirestore } = getFirebase("onCreatedInstanceLog");
		const { internal, metadata, ...log } = createdDoc.data();

		if (internal) return;

		try {
			// Attempt to log offender
			offenderLogger(firebaseFirestore, createdDoc.ref, metadata);

			// Set course ref
			if (metadata.courseRef) {
				const courseRef = firebaseFirestore.doc(metadata.courseRef);

				// Increment logs count
				courseRef.update({ logs: FieldValue.increment(1) });

				return { courseRef };
			}
		} catch (err) {
			const logsRef = firebaseFirestore.collection("logs");

			// Internal log (Prevent infinite loop)
			logsRef.add({
				at: "functions:instances:onCreatedInstanceLog",
				message: "Error logging offender",
				error: err,
				metadata: log,
				internal: true,
			});
		}
	},
	{
		defaults: {
			lock: false,
		},
	}
);
/**
 * Update timestamp
 *
 * @docType instanceLog
 * @event updated
 */
export const onUpdatedInstanceLog = onUpdated<LogData>("instances/logs");
/**
 * Delete timestamp
 *
 * @docType instanceLog
 * @event deleted
 */
export const onDeletedInstanceLog = onDeleted("instances/logs", (deletedDoc) => {
	const { courseRef } = deletedDoc.data();

	if (!courseRef) return;

	// Decrement logs count
	courseRef.update({ logs: FieldValue.increment(-1) });
});

/**
 * Create timestamp
 *
 * @docType instanceCounter
 * @event created
 */
export const onCreatedInstanceCounter = onCreated("instances/counters", undefined, {
	defaults: {
		lock: true,
	},
});
/**
 * Update timestamp
 *
 * @docType instanceCounter
 * @event updated
 */
export const onUpdatedInstanceCounter = onUpdated("instances/counters");

// DELETE ALL FUNCTIONS COMMAND
// firebase functions:delete onCreatedInstance onUpdatedInstance --force
// firebase functions:delete onCreatedInstanceLog onUpdatedInstanceLog onDeletedInstanceLog --force
// firebase functions:delete onCreatedInstanceCounter onUpdatedInstanceCounter --force
