import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import { type SharedDocument } from "./entities";
import type { uSIAProgram } from "~/functions/src/types/SIA";

export type Resolve<T extends SharedDocument> = [T, (v?: boolean | iNodeFnResponse) => void];

export interface CourseValues {
	name?: string;
	code?: string;
	program: uSIAProgram;
}
