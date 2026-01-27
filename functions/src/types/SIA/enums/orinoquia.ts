import {
	eSIABogotaPrograms,
	eSIAEnfermeryBogotaProgram,
	eSIAHumanScienceBogotaProgram,
} from "./bogota.js";
import { eSIAExactSciencesManizalesProgram, eSIAManizalesPrograms } from "./manizales.js";
import { eSIAMedellinPrograms, eSIAMinesMedellinProgram } from "./medellin.js";
import { eSIAPalmiraPrograms } from "./palmira.js";

/**
 * Orinoquia faculties.
 *
 * Orinoquia is its own faculty for global courses.
 */
export enum eSIAOrinoquiaFaculty {
	SEDE_ORINOQUIA = "7000 SEDE ORINOQUIA",
	FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES = "7037 FACULTAD DE CIENCIAS EXACTAS Y NATURALES (Admisión PAET)",
	FACULTAD_DE_CIENCIAS_HUMANAS = "7052 FACULTAD DE CIENCIAS HUMANAS (Admisión PAET)",
	FACULTAD_DE_ENFERMERÍA = "7054 FACULTAD DE ENFERMERÍA (Admisión PAET)",
	FACULTAD_DE_MINAS = "7068 FACULTAD DE MINAS (Admisión PAET)",
}

/**
 * Orinoquia global (7000) programs
 */
export const eSIAOrinoquiaProgram = {
	// PAET programs
	...eSIABogotaPrograms,
	...eSIAMedellinPrograms,
	...eSIAManizalesPrograms,
	...eSIAPalmiraPrograms,
	// Orinoquia global programs
	COMPONENTE_DE_LIBRE_ELECCIÓN: "7PEL PROGRAMA DE ASIGNATURAS DE LIBRE ELECCION",
} as const;

type eSIAOrinoquiaProgram = (typeof eSIAOrinoquiaProgram)[keyof typeof eSIAOrinoquiaProgram];

/**
 * Exact and natural sciences faculty (7037) programs
 */
export enum eSIANaturalSciencesOrinoquiaProgram {
	CIENCIAS_DE_LA_COMPUTACIÓN = eSIAExactSciencesManizalesProgram.CIENCIAS_DE_LA_COMPUTACIÓN,
}

/**
 * Human sciences faculty (7052) programs
 */
export enum eSIAHumanSciencesOrinoquiaProgram {
	ANTROPOLOGIA = eSIAHumanScienceBogotaProgram.ANTROPOLOGÍA,
}

/**
 * Nursing faculty (7054) programs
 */
export enum eSIANursingOrinoquiaProgram {
	ENFERMERIA = eSIAEnfermeryBogotaProgram.ENFERMERÍA,
}

/**
 * Mining faculty (7068) programs
 */
export enum eSIAMiningOrinoquiaProgram {
	INGENIERÍA_AMBIENTAL = eSIAMinesMedellinProgram.INGENIERÍA_AMBIENTAL_B,
}

export type uSIAOrinoquiaProgram =
	| eSIAOrinoquiaProgram
	| eSIANaturalSciencesOrinoquiaProgram
	| eSIAHumanSciencesOrinoquiaProgram
	| eSIANursingOrinoquiaProgram
	| eSIAMiningOrinoquiaProgram;
