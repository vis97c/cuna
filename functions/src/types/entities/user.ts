import type { DocumentReference } from "firebase-admin/firestore";

import type { UserData } from "@open-xamu-co/firebase-nuxt/functions";

import type { ExtendedInstanceData } from "./instance";

/**
 * Firebase user
 */
export interface ExtendedUserData extends UserData {
	/** @automated User could belong to multiple instances */
	instancesRefs?: DocumentReference<ExtendedInstanceData>[];
	/** @automated User is banned these instances */
	bannedInstancesRefs?: DocumentReference<ExtendedInstanceData>[];
}
