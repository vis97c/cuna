import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import { type SharedDocument } from "./entities";
import type { eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "~/functions/src/types/SIA";

export type Resolve<T extends SharedDocument> = [T, (v?: boolean | iNodeFnResponse) => void];

interface PartialCourseValues {
	name?: string;
	code?: string;
	place?: eSIAPlace;
	faculty?: uSIAFaculty;
	program?: uSIAProgram;
	typology?: eSIATypology;
}

/**
 * Code or Program
 */
export type CourseValues =
	| (PartialCourseValues & { code: string })
	| (PartialCourseValues & { program: uSIAProgram });
