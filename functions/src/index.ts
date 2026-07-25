import type { ProxyData } from "./types/entities/index.ts";
import { onCreated, onUpdated } from "./utils/event.ts";

export * from "./auth.ts";
export * from "./logs.ts";
export * from "./instances/index.ts";
export * from "./storage.ts";

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
		sessionTimeout: 1,
		score: 1,
		disabled: false,
		lock: true,
	},
});
/**
 * Update timestamp
 * Get timeout average, sessionTimeout average & update score
 *
 * @docType proxy
 * @event updated
 */
export const onUpdatedProxy = onUpdated<ProxyData>("proxies", async (updated, existing) => {
	const { timeout = 1, sessionTimeout = 1, timesDead = 1, timesAlive = 1 } = updated.data();
	const { timeout: oldTimeout = 1, sessionTimeout: oldSessionTimeout = 1 } = existing.data();

	return {
		timeout: (timeout + oldTimeout) / 2,
		sessionTimeout: (sessionTimeout + oldSessionTimeout) / 2,
		score: timesDead / timesAlive,
	};
});
