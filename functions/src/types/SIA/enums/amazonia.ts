import { eSIABogotaPrograms, eSIAHumanScienceBogotaProgram } from "./bogota";
import { eSIAExactSciencesManizalesProgram, eSIAManizalesPrograms } from "./manizales";
import {
	eSIAArchitectureMedellinProgram,
	eSIAMedellinPrograms,
	eSIAMinesMedellinProgram,
} from "./medellin";
import { eSIAPalmiraPrograms } from "./palmira";

/**
 * Amazonia faculties.
 *
 * Amazonia is its own faculty for global courses.
 */
export enum eSIAAmazoniaFaculty {
	SEDE_AMAZONIA = "6000 SEDE AMAZONIA",
	FACULTAD_DE_ARQUITECTURA = "6064 FACULTAD DE ARQUITECTURA (Admisión PAET)",
	FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES = "6037 FACULTAD DE CIENCIAS EXACTAS Y NATURALES (Admisión PAET)",
	FACULTAD_DE_CIENCIAS_HUMANAS = "6052 FACULTAD DE CIENCIAS HUMANAS (Admisión PAET)",
	FACULTAD_DE_MINAS = "6068 FACULTAD DE MINAS (Admisión PAET)",
}

/**
 * Amazonia global (6000) programs
 */
export const eSIAAmazoniaProgram = {
	// PAET programs
	...eSIABogotaPrograms,
	...eSIAMedellinPrograms,
	...eSIAManizalesPrograms,
	...eSIAPalmiraPrograms,
	// Amazonia global programs
	COMPONENTE_DE_LIBRE_ELECCIÓN: "6PEL PROGRAMA DEL COMPONENTE DE LIBRE ELECCIÓN",
} as const;

type eSIAAmazoniaProgram = (typeof eSIAAmazoniaProgram)[keyof typeof eSIAAmazoniaProgram];

/**
 * Architecture faculty (6064) programs
 */
export enum eSIAArchitectureAmazoniaProgram {
	ARQUITECTURA = eSIAArchitectureMedellinProgram.ARQUITECTURA,
}

/**
 * Exact and natural sciences faculty (6037) programs
 */
export enum eSIANaturalSciencesAmazoniaProgram {
	CIENCIAS_DE_LA_COMPUTACIÓN = eSIAExactSciencesManizalesProgram.CIENCIAS_DE_LA_COMPUTACIÓN,
}

/**
 * Human sciences faculty (6052) programs
 */
export enum eSIAHumanSciencesAmazoniaProgram {
	ANTROPOLOGIA = eSIAHumanScienceBogotaProgram.ANTROPOLOGÍA,
}

/**
 * Mining faculty (6068) programs
 */
export enum eSIAMiningAmazoniaProgram {
	INGENIERÍA_AMBIENTAL = eSIAMinesMedellinProgram.INGENIERÍA_AMBIENTAL_B,
}

export type uSIAAmazoniaProgram =
	| eSIAAmazoniaProgram
	| eSIAArchitectureAmazoniaProgram
	| eSIANaturalSciencesAmazoniaProgram
	| eSIAHumanSciencesAmazoniaProgram
	| eSIAMiningAmazoniaProgram;
