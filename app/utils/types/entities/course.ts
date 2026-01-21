import type { DocumentReference, FieldValue } from "firebase/firestore";
import type { FirebaseDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { Teacher } from "./teacher";
import type { CourseData, CourseLogData, GroupData } from "~~/functions/src/types/entities";

/**
 * Firebase course log
 */
export interface CourseLog extends FirebaseDocument, FromData<CourseLogData> {
	course?: Course;
}
/** This one goes to the database */
export interface CourseLogRef extends GetRef<CourseLog> {
	courseRef?: DocumentReference | FieldValue;
}

/**
 * SIA Course
 */
export interface Course extends FirebaseDocument, FromData<CourseData> {
	groups?: Group[];
	unreported?: Group[];
	/** @automated Last scrape date */
	scrapedAt?: string | Date;
}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface CourseRef extends GetRef<Course, "scrapedAt"> {
	/** @automated Last scrape date */
	scrapedAt?: Date;
}

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

export interface GroupEs {
	id: string;
	cupos: string;
	espacios?: string[];
	profesores: Teacher[];
	horarios: Group;
	inscrito: Group;
	/** Semestre actual */
	semestre: string;
}
