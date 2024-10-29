import type { iPagination } from "@open-xamu-co/ui-common-types";

export interface PseudoNode extends Record<string, any> {
	[key: `${string}Ref`]: Record<string, any>;
	[key: `${string}Refs`]: Record<string, any>[];
}

export interface iSnapshotConfig {
	/**
	 * Refs level
	 *
	 * @default 0 - All refs will be omited
	 */
	level?: number;
	/**
	 * Omit these properties
	 *
	 * to omit "productRef"
	 * @example { omit: [ "product"]}
	 */
	omit?: string[];
}
export interface iUseEdges extends iPagination, iSnapshotConfig {
	/**
	 * Get these specific documents from collection.
	 *
	 * @example "nodeUid" and "collectionId/nodeUid" are valid id structures
	 *
	 * According to firebase docs, queries are limited to 30 disjuntion operations
	 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
	 */
	include?: boolean | string[];
}
export interface iUsePage extends iUseEdges {
	/**
	 * Bypass limitations
	 */
	visible?: boolean;
	page?: boolean;
}
