import type { MemberAbuseData, MemberData } from "~~/functions/src/types/entities";

import type { InputFromData, OutputFromData, RefFromData } from "./base";

/** @output Member data */
export interface Member extends OutputFromData<MemberData> {}
/** @output Member with client refs */
export interface MemberRef extends RefFromData<MemberData> {}
/** @input This one goes to the database */
export interface MemberInput extends InputFromData<MemberData> {}

/** @output Instance member abuse data */
export interface MemberAbuse extends OutputFromData<MemberAbuseData> {}
/** @output Instance member abuse with client refs */
export interface MemberAbuseRef extends RefFromData<MemberAbuseData> {}
/** @input This one goes to the database */
export interface MemberAbuseInput extends InputFromData<MemberAbuseData> {}
