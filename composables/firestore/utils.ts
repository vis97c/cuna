/**
 * Logging for debugging purposes on client
 */
export function debugFirebaseClient(mss: string, ...args: any[]) {
	const { debugFirebase } = useRuntimeConfig().public;

	if (debugFirebase && import.meta.client) console.debug(`Client: ${mss},`, ...args);
}
