import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import type { FirebaseData } from "~~/functions/src/types/entities/base.ts";
import type { OutputFromData } from "./entities/base.ts";

export * from "./entities/index.ts";
export * from "./values.ts";
export * from "./scraping.ts";
export * from "./firestore.ts";
export * from "./fetching.ts";

/**
 * Resolve promise with a new or updated firebase document
 */
export type Resolve<
	V extends OutputFromData<FirebaseData>,
	P extends [V?, ...any[]] = [V],
	E extends Record<string, any> = Record<string, any>,
> = [(v?: boolean | iNodeFnResponse<V, E>) => void, ...P];

export interface Country {
	name: string;
	indicative: string;
	currency: string;
	emoji: string;
	latitude: string;
	longitude: string;
	code: string;
}
