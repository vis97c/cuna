/**
 * This scraper follows sia_scrapper implementation by https://github.com/pablomancera
 *
 * @see https://github.com/pablomancera/sia_scrapper
 */

export enum eHTMLElementIds {
	LEVEL = "pt1:r1:0:soc1::content",
	PLACE = "pt1:r1:0:soc9::content",
	FACULTY = "pt1:r1:0:soc2::content",
	PROGRAM = "pt1:r1:0:soc3::content",
	TYPOLOGY = "pt1:r1:0:soc4::content",
	NAME = "pt1:r1:0:it11::content",
	SEARCH_LE = "pt1:r1:0:soc5::content",
	// Search by program
	PROGRAM_PROGRAM_LE = "pt1:r1:0:soc8::content",
	// Search by faculty
	FACULTY_PLACE_LE = "pt1:r1:0:soc10::content",
	FACULTY_FACULTY_LE = "pt1:r1:0:soc6::content",
	FACULTY_PROGRAM_LE = "pt1:r1:0:soc7::content",
	// Results
	SHOW = "pt1:r1:0:cb1",
	TABLE = "pt1:r1:0:t4::db",
}

export interface CourseLink {
	code: string;
	credits: number;
	typology?: string; // eSIATypology
	name: string;
	description: string;
}

export interface CourseGroupLink {
	name: string;
	spots: number;
	schedule: string[]; // tWeeklySchedule
	teachers: string[];
	activity: string;
	classrooms: string[];
	periodStartAt: string;
	periodEndAt: string;
	availableSpots: number;
	typology: string; // eSIATypology
}

export type tCoursesSearchMode = "faculty" | "program" | "programOld";

/**
 * Courses scrape dynamic payload
 */
export interface iCoursesPayload {
	level: string; // eSIALevel
	place: string; // eSIAPlace
	faculty: string; // uSIAFaculty
	program: string; // uSIAProgram
	typology?: string; // eSIATypology
	/**
	 * Search mode for LE typology courses
	 * - faculty: Search by faculty
	 * - program: Search by program
	 * - programOld: Search by program. But place (old version)
	 */
	searchMode?: tCoursesSearchMode;
}

/**
 * Group scrape dynamic payload
 * Different programs could offer different groups for the same course
 * Different typologies could offer different groups for the same course
 */
export interface iGroupsPayload {
	course: Record<string, any>; // CourseData
	faculty: string; // uSIAFaculty
	program: string; // uSIAProgram
	typology?: string; // eSIATypology
}

/**
 * Returns the LE program for a given place
 * From eSIAPlace to uSIAProgram
 */
export const SIALEPrograms: Record<string, string> = {
	"SEDE BOGOTÁ": "2CLE COMPONENTE DE LIBRE ELECCIÓN",
	"SEDE MEDELLÍN": "3CLE COMPONENTE DE LIBRE ELECCIÓN",
	"SEDE PALMIRA": "5CLE PLAN COMPONENTE DE LIBRE ELECCION ACUERDO 033",
	"SEDE TUMACO": "9PEL PROGRAMA DE ASIGNATURAS DE LIBRE ELECCION",
	"SEDE ORINOQUÍA": "7PEL PROGRAMA DE ASIGNATURAS DE LIBRE ELECCION",
	"SEDE LA PAZ": "0CLE COMPONENTE DE LIBRE ELECCIÓN SEDE LA PAZ",
	"SEDE AMAZONÍA": "6PEL PROGRAMA DEL COMPONENTE DE LIBRE ELECCIÓN",
	"SEDE MANIZALES": "4CLE COMPONENTE DE LIBRE ELECCIÓN",
	"SEDE CARIBE": "8PEL PROGRAMA DEL COMPONENTE DE LIBRE ELECCIÓN",
} as const;

/**
 * From OldSIA to SIA eSIATypology
 */
export const SIATypologies: Record<string, string> = {
	"DISCIPLINAR OPTATIVA (T)": "T DISCIPLINAR OPTATIVA",
	"DISCIPLINAR OBLIGATORIA (C)": "C DISCIPLINAR OBLIGATORIA",
	"FUND. OBLIGATORIA (B)": "B FUND. OBLIGATORIA",
	"FUND. OPTATIVA (O)": "O FUND. OPTATIVA",
	"NIVELACIÓN (E)": "E NIVELACIÓN",
	"TRABAJO DE GRADO (P)": "P TRABAJO DE GRADO",
	"LIBRE ELECCIÓN (L)": "L LIBRE ELECCIÓN",
} as const;
