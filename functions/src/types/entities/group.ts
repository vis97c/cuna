import type { FirebaseData } from "@open-xamu-co/firebase-nuxt/functions";

import type { uSIAProgram } from "../SIA";

export interface EnrolledGroup extends Pick<GroupData, "name" | "schedule" | "teachers"> {
	courseId: string;
	courseCode: string;
	courseName: string;
}
export type tWeeklySchedule = [string?, string?, string?, string?, string?, string?, string?];

/**
 * Interface representing a SIA Group data.
 */
export interface GroupData extends FirebaseData {
	/**
	 * Unique SIA id
	 *
	 * @deprecated
	 */
	SIA?: number;
	/** Explorer V1 unique id */
	ExplorerV1Id?: number;
	/** Explorer V2 unique id */
	ExplorerV2Id?: string;
	name?: string;
	/** Total number of available spots. */
	spots?: number;
	/** Schedule for each day of the week */
	schedule?: tWeeklySchedule;
	teachers?: string[];
	/**
	 * Activity name.
	 * @example "CLASE TEORICA 2015162 (2015162)"
	 */
	activity?: string;
	availableSpots?: number;
	classrooms?: string[];
	/**
	 * Period.
	 * @example "07/10/24-03/02/25"
	 */
	period?: string;
	programs?: uSIAProgram[];
}
