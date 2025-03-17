import { eSIABogotaPrograms, eSIAEnfermeryBogotaProgram } from "./bogota";
import { eSIAManizalesPrograms } from "./manizales";
import { eSIAMedellinPrograms, eSIAMinesMedellinProgram } from "./medellin";
import { eSIAPalmiraPrograms } from "./palmira";

/**
 * Caribe faculties.
 *
 * Caribe is its own faculty for global courses.
 */
export enum eSIACaribeFaculty {
	SEDE_CARIBE = "8000 SEDE CARIBE",
	FACULTAD_DE_ENFERMERÍA = "8054 FACULTAD DE ENFERMERÍA (Admisión PAET)",
	FACULTAD_DE_MINAS = "8068 FACULTAD DE MINAS (Admisión PAET)",
}

/**
 * Caribe global (8000) programs
 */
export const eSIACaribeProgram = {
	// PAET programs
	...eSIABogotaPrograms,
	...eSIAMedellinPrograms,
	...eSIAManizalesPrograms,
	...eSIAPalmiraPrograms,
	// Caribe global programs
	COMPONENTE_DE_LIBRE_ELECCIÓN: "8PEL PROGRAMA DEL COMPONENTE DE LIBRE ELECCIÓN",
} as const;

type eSIACaribeProgram = (typeof eSIACaribeProgram)[keyof typeof eSIACaribeProgram];

/**
 * Nursing faculty (8054) programs
 */
export enum eSIANursingCaribeProgram {
	ENFERMERIA = eSIAEnfermeryBogotaProgram.ENFERMERÍA,
}

/**
 * Mining faculty (8068) programs
 */
export enum eSIAMiningCaribeProgram {
	INGENIERÍA_AMBIENTAL = eSIAMinesMedellinProgram.INGENIERÍA_AMBIENTAL_B,
}

export type uSIACaribeProgram =
	| eSIACaribeProgram
	| eSIANursingCaribeProgram
	| eSIAMiningCaribeProgram;
