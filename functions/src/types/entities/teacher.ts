import type { DocumentReference } from "firebase-admin/firestore";

import type { CourseData } from "./course.js";
import type { SearchData } from "./base.js";

export interface TeacherData extends SearchData {
	coursesRefs?: DocumentReference<CourseData>[];
	/** @automation */
	losEstudiantesSlug?: string;
}
