import type { SharedDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { NoteData, NoteVoteData } from "~~/functions/src/types/entities";

/** @output Note  */
export interface Note extends SharedDocument, FromData<NoteData> {}
/** @input Omit automation */
export interface NoteRef extends GetRef<Note> {}

/** @output Note vote  */
export interface NoteVote extends SharedDocument, FromData<NoteVoteData> {}
/** @input Omit automation */
export interface NoteVoteRef extends GetRef<NoteVote> {}
