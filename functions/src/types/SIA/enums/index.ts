import type { eSIAAmazoniaFaculty, uSIAAmazoniaProgram } from "./amazonia.js";
import type { eSIABogotaFaculty, uSIABogotaProgram } from "./bogota.js";
import type { eSIACaribeFaculty, uSIACaribeProgram } from "./caribe.js";
import type { eSIALaPazFaculty, uSIALaPazProgram } from "./la-paz.js";
import type { eSIAManizalesFaculty, uSIAManizalesProgram } from "./manizales.js";
import type { eSIAMedellinFaculty, uSIAMedellinProgram } from "./medellin.js";
import type { eSIAOrinoquiaFaculty, uSIAOrinoquiaProgram } from "./orinoquia.js";
import type { eSIAPalmiraFaculty, uSIAPalmiraProgram } from "./palmira.js";
import type { eSIATumacoFaculty, uSIATumacoProgram } from "./tumaco.js";

export * from "./bogota.js";
export * from "./la-paz.js";
export * from "./medellin.js";
export * from "./manizales.js";
export * from "./amazonia.js";
export * from "./caribe.js";
export * from "./orinoquia.js";
export * from "./palmira.js";
export * from "./tumaco.js";

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
