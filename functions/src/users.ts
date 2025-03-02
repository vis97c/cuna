import { region } from "firebase-functions/v1";

import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";

import { functionLogger, functionsFirestore } from "./utils/initialize";
import { onCreated, onUpdated } from "./utils/event";

// users timestamp

/**
 * Create timestamp
 *
 * @docType user
 * @event created
 */
export const onCreatedUser = onCreated("users");
/**
 * Update timestamp
 *
 * @docType user
 * @event updated
 */
export const onUpdatedUser = onUpdated("users");
/**
 * Register aditional user data on firestore
 *
 * Will also trigger the timestamp update
 *
 * @docType auth
 * @event created
 */
export const onCreatedAuth = beforeUserCreated({ region: "us-east1" }, ({ data }) => {
	try {
		if (!data || !data.email?.includes("@unal.edu.co")) {
			throw new HttpsError("invalid-argument", "Unauthorized email");
		}

		const { uid, email, displayName, photoURL } = data;
		const userRef = functionsFirestore.collection("users").doc(uid);

		userRef.set({ uid, email, name: displayName, role: 3, photoURL }, { merge: true });
	} catch (err) {
		functionLogger("functions:users:onCreatedAuth", err);

		throw err;
	}
});
/**
 * Remove user data from firestore
 *
 * Unsupported on v2
 *
 * @docType auth
 * @event deleted
 */
export const onDeletedAuth = region("us-east1")
	.auth.user()
	.onDelete((user) => {
		try {
			const { uid } = user;

			const userRef = functionsFirestore.collection("users").doc(uid);

			return userRef.delete();
		} catch (err) {
			functionLogger("functions:users:onDeletedAuth", err);

			throw err;
		}
	});
