/**
 * La Paz faculties.
 *
 * La Paz is its own faculty for global courses.
 */
export enum eSIALaPazFaculty {
	SEDE_LA_PAZ = "9933 SEDE DE LA PAZ",
	ESCUELA_DE_PREGRADO = "1004 ESCUELA DE PREGRADO DE LA PAZ",
}

/**
 * La paz global (9933) programs
 */
export enum eSIALaPazProgram {
	COMPONENTE_DE_LIBRE_ELECCIÓN = "0CLE COMPONENTE DE LIBRE ELECCIÓN SEDE LA PAZ",
}

/**
 * Pregrado la paz (1004) programs
 */
export enum eSIAPregradoLaPazProgram {
	BIOLOGÍA = "L001 BIOLOGÍA",
	ESTADÍSTICA = "L002 ESTADÍSTICA",
	GEOGRAFÍA = "L003 GEOGRAFÍA",
	GESTIÓN_CULTURAL_Y_COMUNICATIVA = "L004 GESTIÓN CULTURAL Y COMUNICATIVA",
	INGENIERÍA_BIOLÓGICA = "L005 INGENIERÍA BIOLÓGICA",
	INGENIERÍA_MECATRÓNICA = "L006 INGENIERÍA MECATRÓNICA",
}

export type uSIALaPazProgram = eSIALaPazProgram | eSIAPregradoLaPazProgram;
