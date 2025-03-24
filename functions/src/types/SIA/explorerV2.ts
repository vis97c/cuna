import { eSIALevel, eSIAPlace, eSIATypology } from "./enums";

export const eExplorerV2Level = {
	[eSIALevel.PREGRADO]: 1,
	[eSIALevel.POSGRADO]: 2,
} as const;
export type eExplorerV2Level = typeof eExplorerV2Level;

/**
 * From Explorer V2 to SIA level
 */
export const eExploreV2ToLevel = {
	Pregrado: eSIALevel.PREGRADO,
	Posgrado: eSIALevel.POSGRADO,
} as const;
export type eExploreV2ToLevel = typeof eExploreV2ToLevel;

export const eExplorerV2Faculties = {
	[eSIAPlace.BOGOTÁ]: 1,
	[eSIAPlace.MEDELLÍN]: 2,
	[eSIAPlace.MANIZALES]: 3,
	[eSIAPlace.PALMIRA]: 4,
	[eSIAPlace.ORINOQUÍA]: 5,
	[eSIAPlace.AMAZONÍA]: 6,
	[eSIAPlace.CARIBE]: 7,
	[eSIAPlace.TUMACO]: 8,
	[eSIAPlace.LA_PAZ]: 9,
} as const;
export type eExplorerV2Faculties = typeof eExplorerV2Faculties;

/**
 * From Explorer V2 to SIA place
 */
export const eExploreV2ToPlace = {
	Bogotá: eSIAPlace.BOGOTÁ,
	Medellín: eSIAPlace.MEDELLÍN,
	Manizales: eSIAPlace.MANIZALES,
	Palmira: eSIAPlace.PALMIRA,
	Orinoquía: eSIAPlace.ORINOQUÍA,
	Amazonía: eSIAPlace.AMAZONÍA,
	Caribe: eSIAPlace.CARIBE,
	Tumaco: eSIAPlace.TUMACO,
	"La Paz": eSIAPlace.LA_PAZ,
} as const;
export type eExploreV2ToPlace = typeof eExploreV2ToPlace;

/**
 * From Explorer V2 to SIA typologies
 */
export const eExploreV2ToTypology = {
	"Disciplinar optativa": eSIATypology.DISC_OPTATIVA,
	"Disciplinar obligatoria": eSIATypology.DISC_OBLIGATORIA,
	"Fund. Obligatoria": eSIATypology.FUND_OBLIGATORIA,
	"Fund. Optativa": eSIATypology.FUND_OPTATIVA,
	Nivelación: eSIATypology.NIVELACIÓN,
	"Trabajo de grado": eSIATypology.TRABAJO_DE_GRADO,
	"Libre elección": eSIATypology.LIBRE_ELECCIÓN,
} as const;
export type eExploreV2ToTypology = typeof eExploreV2ToTypology;

export interface ExplorerV2Faculty {
	/**
	 * Faculty id
	 *
	 * @example "1d4a0de0-ab5d-46e7-8f5a-54af2fccdff9"
	 */
	id_faculty: string;
	/**
	 * Faculty name
	 *
	 * @example "Facultad de Enfermería"
	 */
	faculty: string;
	/**
	 * Faculty code
	 *
	 * @example "2054"
	 */
	code: string;
}

export interface ExplorerV2Program {
	/**
	 * Program name
	 *
	 * @example "Química"
	 */
	plan: string;
	/**
	 * Program code
	 *
	 * @example "2519"
	 */
	code_plan: string;
	/**
	 * Program id
	 *
	 * @example "dbe8656c-433b-4d07-a062-475d3bd1bc7a"
	 */
	id_plan: string;
}

export interface ExplorerV2Course {
	/**
	 * Course id
	 *
	 * @example "41015"
	 */
	id: string;
	/**
	 * Course id
	 *
	 * @example "Pregrado"
	 */
	nivel: keyof eExploreV2ToLevel;
	/**
	 * Course id
	 *
	 * @example "Bogotá"
	 */
	sede: keyof eExploreV2ToPlace;
	/**
	 * Course id
	 *
	 * @example "Facultad de Ciencias"
	 */
	facultad: string;
	/**
	 * Course id
	 *
	 * @example "2933"
	 */
	cod_plan: string;
	/**
	 * Course id
	 *
	 * @example "Ciencias de La Computación"
	 */
	plan: string;
	/**
	 * Course id
	 *
	 * @example "54ffd384-040d-11f0-addb-2ead6dead655"
	 */
	id_asignatura: string;
	/**
	 * Course id
	 *
	 * @example "2025995"
	 */
	cod_asignatura: string;
	/**
	 * Course id
	 *
	 * @example "Introducción a los sistemas inteligentes"
	 */
	asignatura: string;
	/**
	 * Course id
	 *
	 * @example 3
	 */
	credits: number;
	/**
	 * Course id
	 *
	 * @example "Disciplinar optativa"
	 */
	tipologia: keyof eExploreV2ToTypology;
}
