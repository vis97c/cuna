import type { FromData, FirebaseDocument, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { TeacherData } from "~~/functions/src/types/entities";

export type * from "./course";
export type * from "./group";
export type * from "./user";
export type * from "./instance";

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
