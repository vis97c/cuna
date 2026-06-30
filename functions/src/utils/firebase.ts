import { getApp, getApps, initializeApp, type App, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function getFirebase(at = "Unknown", appOptions?: AppOptions) {
	if (typeof window !== "undefined") {
		throw new Error("This function is only available in server context");
	}

	try {
		let firebaseApp: App;

		try {
			// getApp can trigger errors if app is not initialized
			firebaseApp = getApps().length ? getApp() : initializeApp(appOptions);
		} catch (err: any) {
			firebaseApp = initializeApp(appOptions);
		}

		const firebaseFirestore = getFirestore(firebaseApp);
		const firebaseAuth = getAuth(firebaseApp);
		const firebaseStorage = getStorage();

		// Do once per context
		if (!("ignoreUndefined" in global)) {
			// Ignore undefined values
			firebaseFirestore.settings({ ignoreUndefinedProperties: true });
			Object.assign(global, { ignoreUndefined: true });
		}

		return { firebaseApp, firebaseFirestore, firebaseAuth, firebaseStorage };
	} catch (err: any) {
		throw new Error(`Could not initialize Firebase Admin SDK, ${err.message}, at: ${at}`);
	}
}
