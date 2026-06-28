import { beforeUserCreated, HttpsError } from "firebase-functions/v2/identity";
import { region } from "firebase-functions/v1";

import { getFirebase } from "./utils/firebase.js";
import { makeFunctionsLogger } from "./utils/logger.js";
import { getAnonymizedMember } from "./utils/auth.js";

/**
 * Register aditional member data on firestore
 *
 * Will also trigger the timestamp update
 *
 * @docType auth
 * @event beforeUserCreated
 */
export const onBeforeAuthCreated = beforeUserCreated({ region: "us-east1" }, ({ data }) => {
	const { firebaseFirestore } = getFirebase("onBeforeAuthCreated");
	const logger = makeFunctionsLogger(firebaseFirestore);

	try {
		// Prevent user creation
		if (!data || !data.email?.includes("@unal.edu.co")) {
			throw new HttpsError("invalid-argument", "Unauthorized email");
		}
	} catch (err) {
		logger("functions:auth:onBeforeAuthCreated", err);

		throw err;
	}
});

/**
 * Anonymize user data when user is deleted
 *
 * Unsupported on v2
 *
 * @docType auth
 * @event deleted
 */
export const onDeletedAuth = region("us-east1")
	.auth.user()
	.onDelete(async ({ uid }) => {
		const { firebaseFirestore } = getFirebase("onDeletedAuth");
		const logger = makeFunctionsLogger(firebaseFirestore);

		try {
			const instancesRefs = firebaseFirestore.collection("instances");
			const instanceSnapshot = await instancesRefs.get();

			return Promise.all(
				instanceSnapshot.docs.map((instanceDoc) => {
					const instanceRef = instanceDoc.ref;
					const memberRef = instanceRef.collection("members").doc(uid);

					return memberRef.update(getAnonymizedMember(memberRef));
				})
			);
		} catch (err) {
			logger("functions:users:onDeletedAuth", err);

			throw err;
		}
	});

// DELETE ALL FUNCTIONS COMMAND
// firebase functions:delete onBeforeAuthCreated onDeletedAuth --force
