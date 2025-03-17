import type { eSIAAmazoniaFaculty, uSIAAmazoniaProgram } from "./amazonia";
import type { eSIABogotaFaculty, uSIABogotaProgram } from "./bogota";
import type { eSIACaribeFaculty, uSIACaribeProgram } from "./caribe";
import type { eSIALaPazFaculty, uSIALaPazProgram } from "./la-paz";
import type { eSIAManizalesFaculty, uSIAManizalesProgram } from "./manizales";
import type { eSIAMedellinFaculty, uSIAMedellinProgram } from "./medellin";
import type { eSIAOrinoquiaFaculty, uSIAOrinoquiaProgram } from "./orinoquia";
import type { eSIAPalmiraFaculty, uSIAPalmiraProgram } from "./palmira";
import type { eSIATumacoFaculty, uSIATumacoProgram } from "./tumaco";

export * from "./bogota";
export * from "./la-paz";
export * from "./medellin";
export * from "./manizales";
export * from "./amazonia";
export * from "./caribe";
export * from "./orinoquia";
export * from "./palmira";
export * from "./tumaco";

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
	LA_PAZ = "SEDE DE LA PAZ", // L000
	BOGOTÁ = "SEDE BOGOTÁ", // 2000
	MEDELLÍN = "SEDE MEDELLÍN", // 3000
	MANIZALES = "SEDE MANIZALES", // 4000
	PALMIRA = "SEDE PALMIRA", // 5000
	AMAZONÍA = "SEDE AMAZONÍA", // 6000
	ORINOQUÍA = "SEDE ORINOQUÍA", // 7000
	CARIBE = "SEDE CARIBE", // 8000
	TUMACO = "SEDE TUMACO", // 9000
}

export type uSIAFaculty =
	| eSIABogotaFaculty
	| eSIALaPazFaculty
	| eSIAMedellinFaculty
	| eSIAManizalesFaculty
	| eSIAPalmiraFaculty
	| eSIATumacoFaculty
	| eSIAAmazoniaFaculty
	| eSIACaribeFaculty
	| eSIAOrinoquiaFaculty;

export type uSIAProgram =
	| uSIABogotaProgram
	| uSIALaPazProgram
	| uSIAMedellinProgram
	| uSIAManizalesProgram
	| uSIAPalmiraProgram
	| uSIATumacoProgram
	| uSIAAmazoniaProgram
	| uSIACaribeProgram
	| uSIAOrinoquiaProgram;
