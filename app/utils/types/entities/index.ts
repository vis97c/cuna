import type { ProxyData } from "~~/functions/src/types/entities";
import type { OutputFromData, RefFromData, InputFromData } from "./base";

export type * from "./course";
export type * from "./teacher";
export type * from "./member";
export type * from "./instance";
export type * from "./note";

/** @output Proxy data */
export interface Proxy extends OutputFromData<ProxyData> {}
/** @input Proxy with client refs */
export interface ProxyRef extends RefFromData<ProxyData> {}
/** @input This one goes to the database */
export interface ProxyInput extends InputFromData<ProxyData> {}
