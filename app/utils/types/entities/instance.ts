import { DocumentReference } from "firebase/firestore";

import type {
	FromData,
	GetRef,
	Instance,
	InstanceMember,
	SharedDocument,
} from "@open-xamu-co/firebase-nuxt/client";

import type {
	ExtendedInstanceData,
	ExtendedInstanceMemberData,
	ExtendedUserData,
	InstanceMemberAbuseData,
} from "~~/functions/src/types/entities";
import type { ExtendedUser } from "./user";

/**
 * App instance
 * @output
 * @overload
 */
export interface ExtendedInstance extends Omit<Instance, "config">, FromData<ExtendedInstanceData> {
	ownedBy?: ExtendedInstanceMember;
}

/**
 * This one goes to the database
 *
 * @input Omit automation
 */
export interface ExtendedInstanceRef extends GetRef<ExtendedInstance> {
	ownedByRef?: DocumentReference<ExtendedInstanceMemberData>;
}

/**
 * Instance member
 * @output
 * @overload
 */
export interface ExtendedInstanceMember
	extends InstanceMember, FromData<ExtendedInstanceMemberData> {
	user?: ExtendedUser;
	rootMember?: ExtendedInstanceMember;
}
/** @input Omit automation */
export interface ExtendedInstanceMemberRef extends GetRef<ExtendedInstanceMember> {
	userRef?: DocumentReference<ExtendedUserData>;
	rootMemberRef?: DocumentReference<ExtendedInstanceMemberData>;
}

/** @output Instance member abuse */
export interface InstanceMemberAbuse extends SharedDocument, FromData<InstanceMemberAbuseData> {}
/** @input Omit automation */
export interface InstanceMemberAbuseRef extends GetRef<InstanceMemberAbuse> {}
