import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";
import type { FirebaseData } from "~~/functions/src/types/entities/base";
import type { OutputFromData } from "./entities/base";

export * from "./entities";
export * from "./values";
export * from "./scraping";
export * from "./firestore";

/**
 * Resolve promise with a new or updated firebase document
 */
export type Resolve<
	V extends OutputFromData<FirebaseData>,
	P extends [V?, ...any[]] = [V],
	E extends Record<string, any> = Record<string, any>,
> = [(v?: boolean | iNodeFnResponse<V, E>) => void, ...P];

export interface CountriesResponse<T> {
	error: null | string;
	data: T;
}

export interface Country {
	name: string;
	indicative: string;
	currency: string;
	emoji: string;
	latitude: string;
	longitude: string;
	code: string;
}
