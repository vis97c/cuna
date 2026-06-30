import type { DocumentReference } from "firebase/firestore";

import type { LogData, OffenderData } from "~~/functions/src/types/entities";

import type { InputFromData, OutputFromData, RefFromData } from "./base";

/** @output Log data */
export interface Log extends OutputFromData<LogData> {}
/** @output Log with client refs */
export interface LogRef extends RefFromData<LogData> {}
/** @input Omit automation */
export interface LogInput extends InputFromData<LogData> {}

/** @output Offender data */
export interface Offender extends OutputFromData<OffenderData> {
	lastLog?: Log;
}
/** @output Offender with client refs */
export interface OffenderRef extends RefFromData<OffenderData> {
	lastLogRef?: DocumentReference<LogData>;
}
/** @input Omit automation */
export interface OffenderInput extends InputFromData<OffenderData> {}
