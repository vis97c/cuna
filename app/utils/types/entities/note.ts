import type { SharedDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { NoteData } from "~~/functions/src/types/entities";

/** @output Instance note  */
export interface Note extends SharedDocument, FromData<NoteData> {}
/** @input Omit automation */
export interface NoteRef extends GetRef<Note> {}
