import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
import type { User } from "~/resources/types/entities";
import { getServerFirebase } from "~/server/utils/firebase";
import { instance } from "~/resources/utils/enviroment";

/**
 * Setup firebase server instance
 */
export default defineNuxtPlugin(async () => {
	const SESSION = useSessionStore();
	const APP = useAppStore();
	const { serverAuth, serverFirestore, serverLogger } = getServerFirebase();

	try {
		const intanceRef = serverFirestore.doc(`instances/${instance}`); // set app instance
		const currentInstance = await intanceRef.get();

		APP.setInstance(resolveSnapshotDefaults(currentInstance.id, currentInstance.data()));

		// set session
		if (!SESSION.token) return SESSION.unsetSession();

		const { uid } = await serverAuth.verifyIdToken(SESSION.token);
		const { displayName, email, photoURL, emailVerified } = await serverAuth.getUser(uid);

		// do not allow unverified users to login
		if (!emailVerified) SESSION.unsetSession();
		else {
			const userRef = serverFirestore.collection("users").doc(uid);
			const userSnapshot = await userRef.get();
			const user: Partial<User> | undefined = userSnapshot.data();

			if (user && (user?.email !== email || user?.photoURL !== photoURL)) {
				// repopulate user data
				await userRef.update({ email, photoURL });
			}

			SESSION.setUser(
				{ uid, name: displayName, email, photoURL, role: user?.role },
				SESSION.token
			);
		}
	} catch (err: any) {
		if (err.code === "auth/id-token-expired") return SESSION.unsetSession(true);

		serverLogger("plugins:firebase.server", err);
	}
});
