import type { SharedDocument, FromData, GetRef } from "@open-xamu-co/firebase-nuxt/client";

import type { ProxyData } from "~~/functions/src/types/entities";

export type * from "./course";
export type * from "./teacher";
export type * from "./user";
export type * from "./instance";
export type * from "./note";

/** @output Proxy */
export interface Proxy extends SharedDocument, FromData<ProxyData> {}
/** @input Omit automation */
export interface ProxyRef extends GetRef<Proxy> {}
