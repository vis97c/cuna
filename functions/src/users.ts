import { region } from "firebase-functions/v1";

import { beforeUserCreated } from "firebase-functions/v2/identity";

import { functionsFirestore } from "./utils/initialize";
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
	if (!data) return;

	const { uid, email, displayName, photoURL } = data;
	const userRef = functionsFirestore.collection("users").doc(uid);

	userRef.set({ uid, email, name: displayName, role: 3, photoURL }, { merge: true });
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
		const { uid } = user;

		const userRef = functionsFirestore.collection("users").doc(uid);

		return userRef.delete();
	});
