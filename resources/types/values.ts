import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import { type FirebaseDocument } from "./entities";
import type {
	eSIALevel,
	eSIAPlace,
	eSIATypology,
	uSIAFaculty,
	uSIAProgram,
} from "~/functions/src/types/SIA";

export type Resolve<T extends FirebaseDocument> = [T, (v?: boolean | iNodeFnResponse) => void];

export interface PartialCourseValues {
	name?: string;
	code?: string;
	level?: eSIALevel;
	place?: eSIAPlace;
	faculty?: uSIAFaculty;
	program?: uSIAProgram;
	typology?: eSIATypology;
}

export type CourseValuesWithCode = PartialCourseValues & { code: string };
export type CourseValuesWithProgram = PartialCourseValues & { program: uSIAProgram };

/**
 * Code or Program
 */
export type CourseValues = CourseValuesWithCode | CourseValuesWithProgram;

export interface InstanceValues {
	description?: string;
	keywords?: string;
}

export interface InstanceBannerValues {
	message: string;
	url: string;
}
