import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
import type { User } from "~/resources/types/entities";
import { credential, instance } from "~/resources/utils/enviroment";

/**
 * Setup firebase server instance
 */
export default defineNuxtPlugin(async () => {
	const SESSION = useSessionStore();
	const APP = useAppStore();
	const serverFirebaseApp = getApps().length ? getApp() : initializeApp({ credential });
	const serverFirestore = getFirestore(serverFirebaseApp);
	const auth = getAuth(serverFirebaseApp);

	try {
		const intanceRef = serverFirestore.doc(`instances/${instance}`); // set app instance
		const currentInstance = await intanceRef.get();

		APP.setInstance(resolveSnapshotDefaults(currentInstance.id, currentInstance.data()));

		// set session
		if (!SESSION.token) return SESSION.unsetSession();

		const { uid } = await auth.verifyIdToken(SESSION.token);
		const { displayName, email, photoURL, emailVerified } = await auth.getUser(uid);

		// do not allow unverified users to login
		if (!emailVerified) SESSION.unsetSession();
		else {
			const userRef = serverFirestore.collection("users").doc(uid);
			const userSnapshot = await userRef.get();
			const user: Partial<User> | undefined = userSnapshot.data();

			if (user && user?.name !== displayName) {
				// repopulate user data
				await userRef.update({ email, name: displayName, photoURL });
			}

			SESSION.setUser(
				{ uid, name: displayName, email, photoURL, role: user?.role },
				SESSION.token
			);
		}
	} catch (err: any) {
		if (err.code) console.debug(err.code);

		SESSION.unsetSession(err.code === "auth/id-token-expired");
	}
});
