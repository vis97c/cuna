import type { TeacherData } from "~~/functions/src/types/entities";
import type { OutputFromData, RefFromData, InputFromData } from "./base";

/** @output Teacher data */
export interface Teacher extends OutputFromData<TeacherData> {}
/** @input Teacher with client refs */
export interface TeacherRef extends RefFromData<TeacherData> {}
/** @input This one goes to the database */
export interface TeacherInput extends InputFromData<TeacherData> {}
