import type { eSIAAmazoniaFaculty, uSIAAmazoniaProgram } from "./amazonia.ts";
import type { eSIABogotaFaculty, uSIABogotaProgram } from "./bogota.ts";
import type { eSIACaribeFaculty, uSIACaribeProgram } from "./caribe.ts";
import type { eSIALaPazFaculty, uSIALaPazProgram } from "./la-paz.ts";
import type { eSIAManizalesFaculty, uSIAManizalesProgram } from "./manizales.ts";
import type { eSIAMedellinFaculty, uSIAMedellinProgram } from "./medellin.ts";
import type { eSIAOrinoquiaFaculty, uSIAOrinoquiaProgram } from "./orinoquia.ts";
import type { eSIAPalmiraFaculty, uSIAPalmiraProgram } from "./palmira.ts";
import type { eSIATumacoFaculty, uSIATumacoProgram } from "./tumaco.ts";

export * from "./bogota.ts";
export * from "./la-paz.ts";
export * from "./medellin.ts";
export * from "./manizales.ts";
export * from "./amazonia.ts";
export * from "./caribe.ts";
export * from "./orinoquia.ts";
export * from "./palmira.ts";
export * from "./tumaco.ts";

export enum eSIALevel {
	PREGRADO = "PREGRADO",
	POSGRADO = "POSGRADO",
}

export enum eSIATypology {
	DISC_OPTATIVA = "T DISCIPLINAR OPTATIVA",
	DISC_OBLIGATORIA = "C DISCIPLINAR OBLIGATORIA",
	FUND_OBLIGATORIA = "B FUND. OBLIGATORIA",
	FUND_OPTATIVA = "O FUND. OPTATIVA",
	NIVELACIÓN = "E NIVELACIÓN",
	TRABAJO_DE_GRADO = "P TRABAJO DE GRADO",
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
