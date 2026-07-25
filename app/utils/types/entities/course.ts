import type { Teacher } from "./teacher.ts";
import type {
	CourseData,
	CourseLogData,
	GroupData,
} from "~~/functions/src/types/entities/index.ts";
import type { eSIATypology } from "~~/functions/src/types/SIA/index.ts";
import type { OutputFromData, RefFromData, InputFromData } from "./base.ts";

/** @output CourseLog data */
export interface CourseLog extends OutputFromData<CourseLogData> {}
/** @input CourseLog with client refs */
export interface CourseLogRef extends RefFromData<CourseLogData> {}
/** @input This one goes to the database */
export interface CourseLogInput extends InputFromData<CourseLogData> {}

/** @output Course data */
export interface Course extends OutputFromData<CourseData> {}
/** @input Course with client refs */
export interface CourseRef extends RefFromData<CourseData> {}
/** @input This one goes to the database */
export interface CourseInput extends InputFromData<CourseData> {}

/** @output Group data */
export interface Group extends OutputFromData<GroupData> {}
/** @input Group with client refs */
export interface GroupRef extends RefFromData<GroupData> {}
/** @input This one goes to the database */
export interface GroupInput extends InputFromData<GroupData> {}

export interface GroupEs {
	id?: string;
	grupo: string;
	cupos: string;
	espacios?: string[];
	profesores: Teacher[];
	horarios: Group;
	inscrito: Group;
	/** Semestre actual */
	semestre: string;
	tipología?: eSIATypology;
}
