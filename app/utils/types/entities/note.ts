import type { NoteData, NoteVoteData } from "~~/functions/src/types/entities/index.ts";
import type { InputFromData, OutputFromData, RefFromData } from "./base.ts";

/** @output Note data */
export interface Note extends OutputFromData<NoteData> {}
/** @input Note with client refs */
export interface NoteRef extends RefFromData<NoteData> {}
/** @input This one goes to the database */
export interface NoteInput extends InputFromData<NoteData> {}

/** @output NoteVote data*/
export interface NoteVote extends OutputFromData<NoteVoteData> {}
/** @input NoteVote with client refs */
export interface NoteVoteRef extends RefFromData<NoteVoteData> {}
/** @input This one goes to the database */
export interface NoteVoteInput extends InputFromData<NoteVoteData> {}
