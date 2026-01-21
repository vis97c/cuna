import type { FirebaseDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { TeacherData } from "~~/functions/src/types/entities";

/**
 * SIA Teacher
 */
export interface Teacher extends FirebaseDocument, FromData<TeacherData> {}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface TeacherRef extends GetRef<Teacher> {}
