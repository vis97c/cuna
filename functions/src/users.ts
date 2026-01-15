import { region } from "firebase-functions/v1";
import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";
import { getAuth } from "firebase-admin/auth";

import { onCreated, onDelete, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { makeFunctionsLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";

import type { ExtendedUserData } from "./types/entities/index.js";

// users timestamp

/**
 * Create timestamp
 *
 * @docType user
 * @event created
 */
export const onCreatedUser = onCreated<ExtendedUserData>("users", undefined, {
	defaults: {
		lock: false,
	},
	exclude: ["instancesRefs", "bannedInstancesRefs"],
});
/**
 * Update timestamp
 *
 * @docType user
 * @event updated
 */
export const onUpdatedUser = onUpdated<ExtendedUserData>("users");
/**
 * Remove auth if user is removed
 *
 * @docType user
 * @event deleted
 */
export const onDeletedUser = onDelete<ExtendedUserData>("users", async (deletedDoc, { logger }) => {
	try {
		const { uid = "", instancesRefs = [] } = deletedDoc.data();

		// Remove member from all instances
		// TODO:Remove or reassign owned instances
		await Promise.all(
			instancesRefs.map((instanceRef) => {
				return instanceRef.collection("members").doc(uid).delete();
			})
		);

		return getAuth().deleteUser(uid);
	} catch (err) {
		logger("functions:users:onDeletedUser", err);

		throw err;
	}
});
/**
 * Register aditional user data on firestore
 *
 * Will also trigger the timestamp update
 *
 * @docType auth
 * @event created
 */
export const onCreatedAuth = beforeUserCreated({ region: "us-east1" }, ({ data }) => {
	const { firebaseFirestore } = getFirebase("onCreatedAuth");
	const logger = makeFunctionsLogger(firebaseFirestore);

	try {
		if (!data || !data.email?.includes("@unal.edu.co")) {
			throw new HttpsError("invalid-argument", "Unauthorized email");
		}

		const { uid, email, displayName, photoURL } = data;
		const userRef = firebaseFirestore.collection("users").doc(uid);

		userRef.set({ uid, email, name: displayName, photoURL }, { merge: true });
	} catch (err) {
		logger("functions:users:onCreatedAuth", err);

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
		const { firebaseFirestore } = getFirebase("onDeletedAuth");
		const logger = makeFunctionsLogger(firebaseFirestore);

		try {
			const { uid } = user;

			const userRef = firebaseFirestore.collection("users").doc(uid);

			return userRef.delete();
		} catch (err) {
			logger("functions:users:onDeletedAuth", err);

			throw err;
		}
	});
