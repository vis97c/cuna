import type { LogData, OffenderData } from "@open-xamu-co/firebase-nuxt/functions";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { offenderLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";
import type { ProxyData } from "./types/entities/index.js";

export * from "./users.js";
export * from "./courses.js";
export * from "./teachers.js";
export * from "./instances.js";
export * from "./notes.js";

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

/**
 * Create timestamp
 *
 * @docType proxy
 * @event created
 */
export const onCreatedProxy = onCreated<ProxyData>("proxies", undefined, {
	defaults: {
		timesDead: 1,
		timesAlive: 1,
		timeout: 1,
		score: 1,
		disabled: false,
		lock: true,
	},
});
/**
 * Update timestamp
 * Get timeout average, update score
 *
 * @docType proxy
 * @event updated
 */
export const onUpdatedProxy = onUpdated<ProxyData>("proxies", async (updated, existing) => {
	const { timeout = 1, timesDead = 1, timesAlive = 1 } = updated.data();
	const { timeout: oldTimeout = 1 } = existing.data();

	return {
		timeout: (timeout + oldTimeout) / 2,
		score: timesDead / timesAlive,
	};
});
