import type { DocumentReference } from "firebase-admin/firestore";

import type { CourseData } from "./course.ts";
import type { SearchData } from "./base.ts";

export interface TeacherData extends SearchData {
	coursesRefs?: DocumentReference<CourseData>[];
	/** @automation */
	losEstudiantesSlug?: string;
}
