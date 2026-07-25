import type { ProxyData } from "~~/functions/src/types/entities/index.ts";
import type { OutputFromData, RefFromData, InputFromData } from "./base.ts";

export type * from "./course.ts";
export type * from "./teacher.ts";
export type * from "./member.ts";
export type * from "./instance.ts";
export type * from "./note.ts";

/** @output Proxy data */
export interface Proxy extends OutputFromData<ProxyData> {}
/** @input Proxy with client refs */
export interface ProxyRef extends RefFromData<ProxyData> {}
/** @input This one goes to the database */
export interface ProxyInput extends InputFromData<ProxyData> {}
