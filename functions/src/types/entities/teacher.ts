import type { DocumentReference } from "firebase-admin/firestore";

import type { FirebaseData } from "@open-xamu-co/firebase-nuxt/functions";

import type { CourseData } from "./course";

export interface TeacherData extends FirebaseData {
	name?: string;
	coursesRefs?: DocumentReference<CourseData>[];
	/** @automation */
	losEstudiantesSlug?: string;
	/** @automation @search */
	indexes?: string[];
}
