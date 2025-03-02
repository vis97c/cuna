import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import { getLog } from "./logs";

export const functionsFirebaseApp = initializeApp();
export const functionsFirestore = getFirestore(functionsFirebaseApp);
export const functionsStorage = getStorage();

export const functionLogger: tLogger = (...args): void => {
	const logData = getLog(...args);

	if (!logData) return;

	try {
		const logRef = functionsFirestore.collection("logs").doc();

		logRef.set(logData, { merge: true });
	} catch (err) {
		console.error("Error logging to db", err);
	}
};
