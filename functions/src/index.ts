import type { LogData, OffenderData } from "@open-xamu-co/firebase-nuxt/functions";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { offenderLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";

export * from "./users.js";
export * from "./courses.js";
export * from "./teachers.js";
export * from "./instances.js";

// logs timestamp
export const onCreatedLog = onCreated<LogData>("logs", (createdDoc) => {
	const { firebaseFirestore } = getFirebase("onCreatedLog");
	const { internal, ...log } = createdDoc.data();

	if (internal) return;

	try {
		// Attempt to log offender
		offenderLogger(firebaseFirestore, createdDoc.ref, log.metadata);
	} catch (err) {
		const logsRef = firebaseFirestore.collection("logs");

		// Internal log (Prevent infinite loop)
		logsRef.add({
			at: "functions:instances:onCreatedLog",
			message: "Error logging offender",
			error: err,
			metadata: log,
			internal: true,
		});
	}
});
export const onUpdatedLog = onUpdated("logs");

/**
 * Create timestamp
 *
 * @docType offender
 * @event created
 */
export const onCreatedOffender = onCreated<OffenderData>("offenders", undefined, {
	defaults: {
		hits: 1,
	},
});
/**
 * Update timestamp
 *
 * @docType offender
 * @event updated
 */
export const onUpdatedOffender = onUpdated<OffenderData>("offenders");
