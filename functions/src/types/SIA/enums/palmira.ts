/**
 * Palmira faculties.
 *
 * Palmira is its own faculty for global courses.
 */
export enum eSIAPalmiraFaculty {
	SEDE_PALMIRA = "5100 SEDE PALMIRA",
	FACULTAD_DE_CIENCIAS_AGROPECUARIAS = "5128 FACULTAD DE CIENCIAS AGROPECUARIAS",
	FACULTAD_DE_INGENIERIA_Y_ADMINISTRACIÓN = "5137 FACULTAD DE INGENIERÍA Y ADMINISTRACIÓN",
	FACULTAD_DE_MEDICINA_VETERINARIA_Y_DE_ZOOTECNIA_PAET = "5057 FACULTAD DE MEDICINA VETERINARIA Y DE ZOOTECNIA (Admisión PAET)",
}

/**
 * Palmira global (5100) programs
 */
export enum eSIAPalmiraProgram {
	MEDICINA_VETERINARIA = "2555 MEDICINA VETERINARIA",
	COMPONENTE_DE_LIBRE_ELECCIÓN = "5CLE PLAN COMPONENTE DE LIBRE ELECCION ACUERDO 033",
}

/**
 * Agronomical Sciences faculty (5128) programs
 */
export enum eSIAgronomicalSciencesPalmiraProgram {
	INGENIERIA_AGRONOMICA = "5970 INGENIERIA AGRONOMICA",
	ZOOTECNIA = "5982 ZOOTECNIA",
}

/**
 * Engineering and Administration faculty (5137) programs
 */
export enum eSIAEngineeringAndAdministrationPalmiraProgram {
	ADMINISTRACION_DE_EMPRESAS = "5904 ADMINISTRACION DE EMPRESAS",
	DISEÑO_INDUSTRIAL = "5932 DISEÑO INDUSTRIAL",
	INGENIERIA_AGRICOLA = "5925 INGENIERIA AGRICOLA",
	INGENIERIA_AGROINDUSTRIAL = "5964 INGENIERIA AGROINDUSTRIAL",
	INGENIERIA_AMBIENTAL = "5948 INGENIERIA AMBIENTAL",
}

/**
 * Veterinarial Medicine and Zootechny faculty (5137) programs
 */
export enum eSIAVeterinarialMedicineAndZootechnyPalmiraProgram {
	MEDICINA_VETERINARIA = "2555 MEDICINA VETERINARIA",
}

export const eSIAPalmiraPrograms = {
	// ...eSIAPalmiraProgram,
	...eSIAgronomicalSciencesPalmiraProgram,
	...eSIAEngineeringAndAdministrationPalmiraProgram,
	...eSIAVeterinarialMedicineAndZootechnyPalmiraProgram,
} as const;

export type uSIAPalmiraProgram =
	| eSIAPalmiraProgram
	| eSIAgronomicalSciencesPalmiraProgram
	| eSIAEngineeringAndAdministrationPalmiraProgram
	| eSIAVeterinarialMedicineAndZootechnyPalmiraProgram;
