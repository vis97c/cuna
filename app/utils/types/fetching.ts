import type { FirebaseData } from "~~/functions/src/types/entities/base.ts";
import type { OutputFromData, RefFromData } from "./entities/base.ts";

export type HydrateNodes<T extends OutputFromData<FirebaseData | RefFromData<FirebaseData>>> = (
	newContent: T[] | null,
	newErrors?: unknown
) => void;

export interface CountriesResponse<T> {
	error: null | string;
	data: T;
}
