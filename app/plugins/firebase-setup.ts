import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { Firestore, getDoc, getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

declare global {
	interface Window {
		FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
	}
}

export interface ClientProvide {
	clientAppCheck: AppCheck;
	clientFirebaseApp: FirebaseApp;
	clientFirestore: Firestore;
	clientStorage: FirebaseStorage;
	clientAuth: Auth;
	resolveClientRefs: ReturnType<typeof makeResolveRefs>;
}

/**
 * Setup firebase client SDK
 *
 * 1. Provide client SDK
 *
 * @plugin
 */
export default defineNuxtPlugin({
	name: "firebase-setup",
	dependsOn: ["pinia"],
	setup({ $config }): { provide: Partial<ClientProvide> } {
		const provide: Partial<ClientProvide> = {};

		if (import.meta.server) return { provide };

		const { firebaseConfig, recaptchaEnterpriseKey, debugAppCheck } = $config.public;

		// Do not crash if firebase config is not provided
		if (!firebaseConfig.projectId) return { provide };

		try {
			// Initialize Firebase
			provide.resolveClientRefs = makeResolveRefs(getDoc);
			provide.clientFirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

			// Initialize Firestore, ignore undefined values
			initializeFirestore(provide.clientFirebaseApp, { ignoreUndefinedProperties: true });
			provide.clientFirestore = getFirestore(provide.clientFirebaseApp);

			// Initialize Auth
			provide.clientAuth = getAuth(provide.clientFirebaseApp);

			// Initialize AppCheck
			self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugAppCheck;
			provide.clientAppCheck = initializeAppCheck(provide.clientFirebaseApp, {
				provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
				isTokenAutoRefreshEnabled: true,
			});

			// Initialize Storage
			provide.clientStorage = getStorage(provide.clientFirebaseApp);

			// Initialize Analytics
			getAnalytics(provide.clientFirebaseApp);

			// Initialize Performance Monitoring
			getPerformance(provide.clientFirebaseApp);
		} catch (err) {
			console.error("Firebase Setup Error", err);
		}

		return { provide };
	},
});
