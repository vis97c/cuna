import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";
import { getPerformance } from "firebase/performance";

import type { User } from "~/resources/types/entities";
import { resolveSnapshotDefaults } from "~/resources/utils/firestore";

/**
 * Setup firebase client instance
 */
export default defineNuxtPlugin(() => {
	const SESSION = useSessionStore();
	const APP = useAppStore();
	const { firebaseConfig, recaptchaEnterpriseKey, debugAppCheck, instance } =
		useRuntimeConfig().public;

	const clientFirebaseApp = initializeApp(firebaseConfig);
	const clientFirestore = getFirestore(clientFirebaseApp);

	// @ts-expect-error firebase override
	self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugAppCheck;

	// set appCheck
	initializeAppCheck(clientFirebaseApp, {
		provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
		isTokenAutoRefreshEnabled: true,
	});
	getAnalytics(clientFirebaseApp); // Initialize Analytics
	getPerformance(clientFirebaseApp); // Initialize Performance Monitoring

	// set session
	const auth = getAuth(clientFirebaseApp);
	// set app instance
	const instanceRef = doc(clientFirestore, "instances", instance);

	onSnapshot(instanceRef, (snapshot) => {
		APP.setInstance(resolveSnapshotDefaults(snapshot.id, snapshot.data()));
	});
	onAuthStateChanged(auth, async (user) => {
		if (!user) return SESSION.unsetSession();

		const { uid, displayName, email, photoURL, emailVerified, isAnonymous } = user;

		// Do not allow unverified users to login
		if (!emailVerified) {
			SESSION.unsetSession();

			auth.signOut();
		} else if (isAnonymous) return;

		const token = await user.getIdToken(true);
		const userRef = doc(clientFirestore, "users", uid);
		const userData = { uid, name: displayName, email, photoURL, role: 3 };
		let data: Partial<User> | undefined = (await getDoc(userRef)).data();

		// Create user on firestore. (Manually created user)
		if (!data) {
			setDoc(userRef, userData, { merge: true });

			data = userData;
		}

		SESSION.setUser({ ...userData, ...data }, token);

		const router = useRouter();
		const route = useRoute();
		const { restricted } = route.query;
		const rdr = typeof restricted === "string" && decodeURI(restricted);

		// redirect
		if (rdr && route.path !== rdr) router.replace(rdr);
		else if (route.path === "/") router.replace("/cursos");
	});

	return { provide: { clientFirebaseApp, clientFirestore } };
});
