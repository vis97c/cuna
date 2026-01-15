import type { FirebaseData } from "@open-xamu-co/firebase-nuxt/functions";

export * from "./course";
export * from "./group";
export * from "./instance";
export * from "./user";

export interface TeacherData extends FirebaseData {
	name?: string;
	courses?: string[];
	/** @automation */
	losEstudiantesSlug?: string;
	/** @search */
	indexes?: string[];
}
