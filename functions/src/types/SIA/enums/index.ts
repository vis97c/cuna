import type { eSIABogotaFaculty, uSIABogotaProgram } from "./bogota";
import type { eSIALaPazFaculty, uSIALaPazProgram } from "./la-paz";
import type { eSIAManizalesFaculty, uSIAManizalesProgram } from "./manizales";
import type { eSIAMedellinFaculty, uSIAMedellinProgram } from "./medellin";

export * from "./bogota";
export * from "./la-paz";
export * from "./medellin";
export * from "./manizales";

export enum eSIALevel {
	PREGRADO = "PREGRADO",
	POSGRADO = "POSGRADO",
}

export enum eSIATypology {
	FUND_OBLIGATORIA = "B FUND. OBLIGATORIA",
	DISC_OBLIGATORIA = "C DISCIPLINAR OBLIGATORIA",
	NIVELACIÓN = "E NIVELACIÓN",
	FUND_OPTATIVA = "O FUND. OPTATIVA",
	TRABAJO_DE_GRADO = "P TRABAJO DE GRADO",
	DISC_OPTATIVA = "T DISCIPLINAR OPTATIVA",
	LIBRE_ELECCIÓN = "L LIBRE ELECCIÓN",
}

/**
 * All UNAL places
 */
export enum eSIAPlace {
	BOGOTÁ = "SEDE BOGOTÁ",
	LA_PAZ = "SEDE DE LA PAZ",
	MEDELLÍN = "SEDE MEDELLÍN",
	MANIZALES = "SEDE MANIZALES",
	// PALMIRA = "SEDE PALMIRA",
	// TUMACO = "SEDE TUMACO",
	// AMAZONÍA = "SEDE AMAZONÍA",
	// CARIBE = "SEDE CARIBE",
	// ORINOQUÍA = "SEDE ORINOQUÍA",
}

export type uSIAFaculty =
	| eSIABogotaFaculty
	| eSIALaPazFaculty
	| eSIAMedellinFaculty
	| eSIAManizalesFaculty;

export type uSIAProgram =
	| uSIABogotaProgram
	| uSIALaPazProgram
	| uSIAMedellinProgram
	| uSIAManizalesProgram;
