/**
 * Logging for debugging purposes on client
 */
export function debugFirebaseClient(mss: string, ...args: any[]) {
	const { debugFirebase } = useRuntimeConfig().public;

	if (debugFirebase && process.client) console.debug(`Client: ${mss},`, ...args);
}
