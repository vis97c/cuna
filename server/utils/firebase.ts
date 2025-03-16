import type { H3Event, EventHandlerRequest } from "h3";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import { clientEmail, privateKey, projectId } from "~/resources/utils/enviroment";
import { getLog } from "~/functions/src/utils/logs";

export function getServerFirebase() {
	const credential = cert({ projectId, privateKey, clientEmail });
	const serverFirebaseApp = getApps().length ? getApp() : initializeApp({ credential });
	const serverFirestore = getFirestore(serverFirebaseApp);
	const serverAuth = getAuth(serverFirebaseApp);
	const serverStorage = getStorage();

	// Do once per context
	if (!("ignoreUndefined" in global)) {
		// Ignore undefined values
		serverFirestore.settings({ ignoreUndefinedProperties: true });
		Object.assign(global, { ignoreUndefined: true });
	}

	return { serverFirebaseApp, serverFirestore, serverAuth, serverStorage, serverLogger };
}

/**
 * Logging for debugging purposes on server
 */
export function debugFirebaseServer<T extends EventHandlerRequest>(
	event: H3Event<T>,
	mss: string,
	...args: any[]
) {
	const { debugFirebase } = useRuntimeConfig().public;

	if (debugFirebase && import.meta.server) {
		const url = getRequestURL(event);

		console.group("\x1b[34m%s\x1b[0m", url);
		console.log(`${mss},`, ...args);
		console.groupEnd();
	}
}

export const serverLogger: tLogger = (...args): void => {
	const logData = getLog(...args);

	if (!logData) return;

	try {
		const { serverFirestore } = getServerFirebase();
		const logRef = serverFirestore.collection("logs").doc();

		logRef.set(logData, { merge: true });
	} catch (err) {
		console.error("Error logging to db", err);
	}
};
