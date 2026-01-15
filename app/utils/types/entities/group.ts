import type { FirebaseDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { GroupData } from "~~/functions/src/types/entities";

/**
 * SIA Group
 */
export interface Group extends FirebaseDocument, FromData<GroupData> {}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface GroupRef extends GetRef<Group> {}
