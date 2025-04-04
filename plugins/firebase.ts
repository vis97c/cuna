import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, onIdTokenChanged, type Auth } from "firebase/auth";
import {
	doc,
	DocumentReference,
	Firestore,
	getFirestore,
	initializeFirestore,
	onSnapshot,
	setDoc,
	type Unsubscribe,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

import { resolveSnapshotDefaults } from "../resources/utils/firestore";
import type { Instance, InstanceRef, User } from "~/resources/types/entities";

declare global {
	interface Window {
		FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
	}
}

interface ClientProvide {
	clientFirebaseApp: FirebaseApp;
	clientFirestore: Firestore;
	clientAuth: Auth;
	instance: string;
}

/**
 * Setup app state
 */
async function setAppState(provide?: ClientProvide) {
	const APP = useAppStore();
	const SESSION = useSessionStore();

	try {
		if (import.meta.server || !provide) return;

		const { clientAuth, clientFirestore } = provide;
		// set app instance
		const instanceRef = doc(clientFirestore, "instances", provide.instance);
		let unsubUser: Unsubscribe;

		onSnapshot(instanceRef, (snapshot) => {
			const instance: InstanceRef = resolveSnapshotDefaults(snapshot.id, snapshot.data());
			const {
				siaMaintenanceTillAt,
				explorerV1MaintenanceTillAt,
				explorerV2MaintenanceTillAt,
			} = instance.config || {};

			const updatedInstance: Instance = {
				...instance,
				config: {
					...instance.config,
					// Parse Timestamp to Date
					siaMaintenanceTillAt: siaMaintenanceTillAt?.toDate(),
					explorerV1MaintenanceTillAt: explorerV1MaintenanceTillAt?.toDate(),
					explorerV2MaintenanceTillAt: explorerV2MaintenanceTillAt?.toDate(),
				},
			};

			APP.setInstance(updatedInstance);
		});

		onIdTokenChanged(clientAuth, async (authUser) => {
			unsubUser?.();

			if (!authUser) return SESSION.unsetSession();

			const { uid, displayName: name, email, photoURL, isAnonymous } = authUser;
			const token = await authUser.getIdToken();
			const userRef: DocumentReference<User> = doc(clientFirestore, "users", uid);

			unsubUser = onSnapshot(userRef, async (snapshot) => {
				// Create user on firestore.
				if (!snapshot.exists()) {
					const user = { uid, name, email, photoURL, isAnonymous, role: 3 };

					// Set new user, do not await
					setDoc(userRef, user, { merge: true });
					SESSION.setUser(user, token);
				} else {
					const { role = 3, ...user } = snapshot.data();

					// Repopulate user data (Manually created), do not await
					if (user?.email !== email || user?.photoURL !== photoURL) {
						setDoc(userRef, { email, photoURL, role }, { merge: true });
					}

					SESSION.setUser({ ...user, role, uid }, token);
				}

				const router = useRouter();
				const route = useRoute();
				const { restricted } = route.query;
				const rdr = typeof restricted === "string" && decodeURI(restricted);

				// redirect
				if (rdr && route.path !== rdr) router.replace(rdr);
				else if (route.path === "/ingresar") router.replace("/");
			});
		});
	} catch (err) {
		APP.unsetInstance();
		useLogger("plugins:firebase:setAppState:setInstance", err);
	}
}

/**
 * Setup firebase client instance
 */
export default defineNuxtPlugin({
	name: "firebase",
	setup() {
		const { firebaseConfig, recaptchaEnterpriseKey, debugAppCheck, instance } =
			useRuntimeConfig().public;
		let provide: ClientProvide | undefined;

		// Setup firebase client SDK
		if (import.meta.client) {
			const clientFirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

			// Initialize Firestore, ignore undefined values
			initializeFirestore(clientFirebaseApp, { ignoreUndefinedProperties: true });

			const clientFirestore = getFirestore(clientFirebaseApp);
			const clientAuth = getAuth(clientFirebaseApp);

			self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugAppCheck;
			// Initialize AppCheck
			initializeAppCheck(clientFirebaseApp, {
				provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
				isTokenAutoRefreshEnabled: true,
			});
			// Initialize Analytics
			getAnalytics(clientFirebaseApp);
			// Initialize Performance Monitoring
			getPerformance(clientFirebaseApp);

			// Inject client methods
			provide = { clientFirebaseApp, clientFirestore, clientAuth, instance };
		}

		// Setup app state, do not await
		setAppState(provide);

		return { provide: (provide ? provide : {}) as Partial<ClientProvide> };
	},
});
