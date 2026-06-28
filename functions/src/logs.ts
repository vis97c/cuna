import type { LogData, OffenderData } from "./types/entities/index.js";
import { onCreated, onUpdated } from "./utils/event.js";
import { getFirebase } from "./utils/firebase.js";
import { offenderLogger } from "./utils/logger.js";

/**
 * Create timestamp
 *
 * @docType log
 * @event created
 */
export const onCreatedLog = onCreated<LogData>(
	"logs",
	(createdDoc) => {
		const { firebaseFirestore } = getFirebase("onCreatedLog");
		const { internal, metadata, ...log } = createdDoc.data();

		if (internal) return;

		try {
			// Attempt to log offender, do not await
			offenderLogger(firebaseFirestore, createdDoc.ref, metadata);
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
	},
	{
		defaults: {
			internal: false,
			metadata: {},
			lock: false,
		},
	}
);
/**
 * Update timestamp
 *
 * @docType log
 * @event updated
 */
export const onUpdatedLog = onUpdated<LogData>("logs");

/**
 * Create timestamp
 *
 * @docType offender
 * @event created
 */
export const onCreatedOffender = onCreated<OffenderData>("offenders", undefined, {
	defaults: {
		hits: 1,
		lock: false,
	},
});
/**
 * Update timestamp
 *
 * @docType offender
 * @event updated
 */
export const onUpdatedOffender = onUpdated<OffenderData>("offenders");

// DELETE ALL FUNCTIONS COMMAND
// firebase functions:delete onCreatedLog onUpdatedLog onCreatedOffender onUpdatedOffender --force
