import { eSIABogotaPrograms, eSIAEnfermeryBogotaProgram, eSIALawBogotaProgram } from "./bogota";
import { eSIAManagementManizalesProgram, eSIAManizalesPrograms } from "./manizales";
import { eSIAMedellinPrograms } from "./medellin";
import { eSIAPalmiraPrograms } from "./palmira";

/**
 * Tumaco faculties.
 *
 * Tumaco is its own faculty for global courses.
 */
export enum eSIATumacoFaculty {
	SEDE_TUMACO = "9000 SEDE TUMACO",
	FACULTAD_DE_ADMINISTRACION = "9046 FACULTAD DE ADMINISTRACION (Admisión PAET)",
	FACULTAD_DE_DERECHO_CIENCIAS_POLITICAS_Y_SOCIALES = "9053 FACULTAD DE DERECHO, CIENCIAS POLÍTICAS Y SOCIALES (Admisión PAET)",
	FACULTAD_DE_ENFERMERIA = "9054 FACULTAD DE ENFERMERÍA (Admisión PAET)",
}

/**
 * Tumaco global (9000) programs
 */
export const eSIATumacoProgram = {
	// PAET programs
	...eSIABogotaPrograms,
	...eSIAMedellinPrograms,
	...eSIAManizalesPrograms,
	...eSIAPalmiraPrograms,
	// Tumaco global programs
	COMPONENTE_DE_LIBRE_ELECCIÓN: "9PEL PROGRAMA DE ASIGNATURAS DE LIBRE ELECCION",
} as const;

type eSIATumacoProgram = (typeof eSIATumacoProgram)[keyof typeof eSIATumacoProgram];

/**
 * Administration faculty (9046) programs
 */
export enum eSIAAdministrationTumacoProgram {
	ADMINISTRACION_DE_EMPRESAS_D = eSIAManagementManizalesProgram.ADMINISTRACION_DE_EMPRESAS_D,
	ADMINISTRACION_DE_EMPRESAS_N = eSIAManagementManizalesProgram.ADMINISTRACION_DE_EMPRESAS_N,
	GESTION_CULTURAL_Y_COMUNICATIVA = eSIAManagementManizalesProgram.GESTION_CULTURAL_Y_COMUNICATIVA,
}

/**
 * Law & social politics faculty (9053) programs
 */
export enum eSIALawAndSocialPoliticsTumacoProgram {
	DERECHO = eSIALawBogotaProgram.DERECHO,
}

/**
 * Nursing faculty (9054) programs
 */
export enum eSIANursingTumacoProgram {
	ENFERMERIA = eSIAEnfermeryBogotaProgram.ENFERMERÍA,
}

export type uSIATumacoProgram =
	| eSIATumacoProgram
	| eSIAAdministrationTumacoProgram
	| eSIALawAndSocialPoliticsTumacoProgram
	| eSIANursingTumacoProgram;
