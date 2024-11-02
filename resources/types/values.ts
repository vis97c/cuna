import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import { type SharedDocument } from "./entities";
import type { eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "~/functions/src/types/SIA";

export type Resolve<T extends SharedDocument> = [T, (v?: boolean | iNodeFnResponse) => void];

export interface PartialCourseValues {
	name?: string;
	code?: string;
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
