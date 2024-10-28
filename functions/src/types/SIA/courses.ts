import type { eSIALevel, eSIAPlace, eSIATypology, uSIAFaculty, uSIAProgram } from "./enums";

/**
 * Interface representing a SIA Faculty data.
 */
export interface SIAFaculty {
	/**
	 * Unique identifier for the faculty.
	 * @example 921
	 */
	ID: number;
	/**
	 * Faculty name.
	 * @example "2052 FACULTAD DE CIENCIAS HUMANAS"
	 */
	NOMBRE: string;
	/**
	 * Identifier for the campus where the faculty is located.
	 * @example 2052
	 */
	idSede: number;
}

/**
 * Interface representing a SIA Place data.
 */
export interface SIAPlace {
	/**
	 * Unique identifier for the place.
	 * @example 12
	 */
	ID: number;
	/**
	 * Place code.
	 * @example "1101"
	 */
	CODIGO: string;
	/**
	 * Place name.
	 * @example "SEDE BOGOTÁ"
	 */
	NOMBRE: eSIAPlace;
	/**
	 * List of faculties associated with the place.
	 */
	Facultades: SIAFaculty[];
}

/**
 * Interface representing a SIA Group data.
 */
export interface SIAGroup {
	/**
	 * Unique identifier for the group.
	 * @example 1109123
	 */
	ID: number;
	/**
	 * Subject code.
	 * @example "2015162"
	 */
	CODIGO_ASIGNATURA: string;
	/**
	 * Group name.
	 * @example "Grupo 1"
	 */
	GRUPO: string;
	/**
	 * Total number of available spots.
	 * @example 50
	 */
	CUPOS: number;
	/**
	 * Monday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_LUNES?: string;
	/**
	 * Tuesday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_MARTES?: string;
	/**
	 * Wednesday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_MIERCOLES?: string;
	/**
	 * Thursday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_JUEVES?: string;
	/**
	 * Friday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_VIERNES?: string;
	/**
	 * Saturday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_SABADO?: string;
	/**
	 * Sunday schedule.
	 * @example "11:00|13:00"
	 */
	HORARIO_DOMINGO?: string;
	/**
	 * State ID.
	 * @example 1
	 */
	IDESTADO: number;
	/**
	 * State date.
	 * @example "2024-10-25T00:00:00.000Z"
	 */
	FECHA_IDESTADO: string;
	/**
	 * Teacher's name.
	 * @example "Ibeth Marcela Rubio Perilla"
	 */
	DOCENTE: string;
	/**
	 * Activity name.
	 * @example "CLASE TEORICA 2015162 (2015162)"
	 */
	ACTIVIDAD: string;
	/**
	 * Associated plans.
	 * @example " *** Plan: 2514 ESTADÍSTICA  *** Plan: 2516 FÍSICA  *** Plan: 2518 MATEMÁTICAS  *** Plan: 2519 QUÍMICA  *** Plan: 2933 CIENCIAS DE LA COMPUTACIÓN  *** Plan: 3507 MATEMÁTICAS "
	 */
	PLANES_ASOCIADOS: string;
	/**
	 * Limit type.
	 * @example "Afirmacion"
	 */
	TIP_LIMITE: string;
	/**
	 * Flag indicating if the limit is for the center.
	 * @example "NO"
	 */
	FLAG_LIM_CENTRO: string;
	/**
	 * Activity ID.
	 * @example "B926291T"
	 */
	ID_ACTIV: string;
	/**
	 * Available spots.
	 * @example 0
	 */
	CUPOS_DISPONIBLES: number;
	/**
	 * Classroom.
	 * @example "405-202"
	 */
	AULA: string;
	/** Parent activity. */
	ACTIVIDAD_PADRE?: unknown;
	/** Parent group. */
	GRUPO_PADRE?: unknown;
	/**
	 * Period.
	 * @example "07/10/24-03/02/25"
	 */
	PERIODO: string;
}

/**
 * Interface representing a SIA Course data.
 */
export interface SIACourse {
	/**
	 * Course searcher ID.
	 * @example 28130
	 */
	IDBUSCADORCURSO: number;
	/**
	 * Education level.
	 * @example "PREGRADO"
	 */
	NIVELDEESTUDIO: eSIALevel;
	/**
	 * Campus.
	 * @example "SEDE BOGOTÁ"
	 */
	SEDE: eSIAPlace;
	/**
	 * Faculty.
	 * @example "2050 FACULTAD DE CIENCIAS"
	 */
	FACULTAD: uSIAFaculty;
	/**
	 * Department.
	 * @example "DEPARTAMENTO DE MATEMATICAS CIENCIAS BOGOTA"
	 */
	UAB: string;
	/**
	 * Study plan.
	 * @example "2933 CIENCIAS DE LA COMPUTACIÓN"
	 */
	PLANDEESTUDIO: uSIAProgram;
	/**
	 * Course type.
	 * @example "B FUND. OBLIGATORIA"
	 */
	TIPOLOGIA: eSIATypology;
	/**
	 * Number of credits.
	 * @example 4
	 */
	NUM_CREDITOS: number;
	/** Flexible schedule. */
	FREANJAHORARIA?: unknown;
	/**
	 * Subject code.
	 * @example "2015168"
	 */
	CODIGO_ASIGNATURA: string;
	/**
	 * Subject name.
	 * @example "Fundamentos de matemáticas"
	 */
	NOMBREASIGNATURA: string;
	/**
	 * Number of groups.
	 * Is not a reliable way of determining the number of groups
	 * @example 4
	 */
	NUMERODEGRUPOS: number;
	/** Whether the course is scheduled. */
	PROGRAMADA: boolean;
	/**
	 * Total number of available spots.
	 * @example 170
	 */
	NUMERODECUPOS: number;
	/**
	 * Percentage of attendance.
	 * @example 0
	 */
	PORCENTAJE_ASISTENCIA: number;
	/** Whether the course is a free elective. */
	ASIGNATURALIBREELECCION: boolean;
	/**
	 * Minimum number of hours.
	 * @example 0
	 */
	MINIMOHORAS: number;
	/**
	 * Number of weeks.
	 * @example 16
	 */
	NUM_SEMANAS: number;
	/** Whether the course is obligatory. */
	OBLIGATORIA: boolean;
	/** Bibliography. */
	BIBLIOGRAFIA?: unknown;
	/** Objectives. */
	OBJETIVOS?: unknown;
	/** Requirements. */
	REQUISITOS?: unknown;
	/** Content. */
	CONTENIDO?: unknown;
	/** Methodology. */
	METODOLOGIA?: unknown;
	/** Detailed course-subject information. */
	DETALLECURSOASIGNATURA: SIAGroup[];
}
