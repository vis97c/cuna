import { DocumentReference, Timestamp } from "firebase/firestore";

import type {
	CourseData,
	FirebaseData,
	GroupData,
	InstanceData,
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
}

/**
 * Document can be modified by any user
 *
 * This data is used to keep track of the changes
 */
export interface SharedDocument extends FirebaseDocument {
	createdBy?: User;
	updatedBy?: User;
}

type FromData<Data extends FirebaseData> = {
	[K in keyof Data as K extends `${string}Ref` | `${string}Refs` | `${string}At`
		? never
		: K]: Data[K];
};

/**
 * Remove FirebaseDocument properties to make valid Ref
 *
 * Ref are used to create and modify firebase document
 * Removed properties are not required or part of automation
 */
export type GetRef<T extends SharedDocument> = Omit<T, "id" | "createdAt" | "updatedAt"> & {
	/** @automated Creation date */
	createdAt?: Timestamp;
	/** @automated Last update date */
	updatedAt?: Timestamp;
	createdByRef?: DocumentReference;
	updatedByRef?: DocumentReference;
};

/**
 * Firebase user
 */
export interface User extends FirebaseDocument, FromData<UserData> {}

/**
 * App instance
 */
export interface Instance extends SharedDocument, FromData<InstanceData> {}

/**
 * SIA Teacher
 */
export interface Teacher extends SharedDocument, FromData<TeacherData> {}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface TeacherRef extends GetRef<Teacher> {}

/**
 * SIA Group
 */
export interface Group extends SharedDocument, FromData<GroupData> {}
/**
 * This one goes to the database
 *
 * Omit automation
 */
export interface GroupRef extends GetRef<Group> {}
export interface EnrolledGroup extends Pick<Group, "name" | "schedule" | "teachers"> {
	courseId: string;
	courseCode: string;
	courseName: string;
}

/**
 * SIA Course
 */
export interface Course extends SharedDocument, FromData<CourseData> {
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
