import type { FirebaseDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { ExtendedUserData } from "~~/functions/src/types/entities";

/**
 * Firebase user
 *
 * @overload
 */
export interface ExtendedUser extends FirebaseDocument, FromData<ExtendedUserData> {}
/** This one goes to the database */
export interface ExtendedUserRef extends GetRef<ExtendedUser> {}
