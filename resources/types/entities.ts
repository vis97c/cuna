import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";

import type {
	CourseData,
	CourseLogData,
	GroupData,
	InstanceConfig,
	InstanceData,
	LogData,
	TeacherData,
	UserData,
} from "~/functions/src/types/entities";

export interface FirebaseDocument {
	/** @automated Document path */
	id?: string;
	/** @automated Creation date */
	createdAt?: string | Date;
	/** @automated Last update date */
	updatedAt?: string | Date;
	createdBy?: User;
	updatedBy?: User;
}

export type FromData<Data extends Record<string, any>> = {
	[K in keyof Data as K extends `${string}Ref` | `${string}Refs`
		? never
		: K]: K extends `${string}At` ? string | Date | undefined : Data[K];
} & {
	id?: string;
};

/**
 * Remove FirebaseDocument properties to make valid Ref
 *
 * Ref are used to create and modify firebase document
 * Removed properties are not required or part of automation
 */
export type GetRef<T extends FirebaseDocument, O extends keyof T = never> = {
	[K in keyof FromData<Omit<T, "id" | O>> as K extends `${string}At` ? never : K]: FromData<
		Omit<T, "id" | O>
	>[K];
} & {
	createdByRef?: DocumentReference | FieldValue;
	updatedByRef?: DocumentReference | FieldValue;
};

/**
 * Firebase log
 */
export interface Log extends FirebaseDocument, FromData<LogData> {}
/** This one goes to the database */
export interface LogRef extends GetRef<Log> {}

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
 * Firebase user
 */
export interface User extends FirebaseDocument, FromData<UserData> {}

/**
 * App instance
 */
export interface Instance extends FirebaseDocument, FromData<Omit<InstanceData, "config">> {
	config?: InstanceConfig<Date>;
}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface InstanceRef extends GetRef<Instance> {
	config?: InstanceConfig<Timestamp>;
}

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
export interface CourseRef extends Omit<GetRef<Course>, "scrapedAt"> {
	/** @automated Last scrape date */
	scrapedAt?: Timestamp;
}
