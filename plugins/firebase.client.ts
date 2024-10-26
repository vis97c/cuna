import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot } from "firebase/firestore";

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

	// set app instance
	const instanceRef = doc(clientFirestore, "instances", instance);
	// set session
	const auth = getAuth(clientFirebaseApp);

	onSnapshot(instanceRef, (snapshot) => {
		APP.setInstance(resolveSnapshotDefaults(snapshot.id, snapshot.data()));
	});
	onAuthStateChanged(auth, async (user) => {
		const router = useRouter();
		const { restricted } = router.currentRoute.value.query;
		const rdr = restricted && typeof restricted === "string" ? decodeURI(restricted) : "/";

		if (!user) return SESSION.unsetSession();

		const { uid, displayName, email, photoURL, emailVerified, isAnonymous } = user;

		// do not allow unverified users to login
		if (!emailVerified && !isAnonymous) {
			SESSION.unsetSession();

			auth.signOut();
		} else {
			const token = await user.getIdToken(true);
			const userRef = doc(clientFirestore, "users", uid);
			const data: Partial<User> | undefined = (await getDoc(userRef)).data();

			SESSION.setUser(
				{ uid, name: displayName, email, photoURL, isAnonymous, ...data },
				token
			);

			if (restricted) router.push(rdr);
		}
	});

	return { provide: { clientFirebaseApp, clientFirestore } };
});
