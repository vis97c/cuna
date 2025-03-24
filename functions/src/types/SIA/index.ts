import type { SIACourse } from "./courses";
import type { eSIALevel, eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "./enums";

export * from "./enums";
export * from "./courses";

/**
 * Payload expected by the courses endpoint
 */
export interface SIACoursesPayload {
	planEstudio: uSIAProgram;
	// optional fields
	nivel?: eSIALevel;
	sede?: eSIAPlace;
	facultad?: uSIAFaculty;
	tipologia?: eSIATypology;
	numcreditos?: number;
	/**
	 * Comma separated list of week days
	 * @example Lunes,Martes
	 */
	dias?: string;
	/**
	 * Hour block
	 * @example 9:00,10:00
	 */
	franja_horaria?: string;
	codigo_asignatura?: string;
	/**
	 * This one behaves like a search
	 */
	nombre_asignatura?: string;
	numgrupos?: number;
	numcupos?: number;
	// pagination
	page?: number;
	limit?: number;
}

export interface CoursesResponse<T> {
	data: T[];
	totalRecords: number;
	totalPages: number;
	currentPage: number;
	/**
	 * Given limit, 10 by default
	 */
	limit: number;
}

export type ExplorerV1CoursesResponse = CoursesResponse<SIACourse>;
