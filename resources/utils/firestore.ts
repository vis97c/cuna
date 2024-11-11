import { deburr } from "lodash-es";

import type { FirebaseDocument } from "../types/entities";
import type { PseudoNode } from "../types/firestore";
import { isNotUndefString } from "./guards";

/** Timestamp breaks nuxt */
export function resolveSnapshotDefaults<T extends PseudoNode>(
	id: string,
	node?: T
): FirebaseDocument {
	return Object.assign({}, node, {
		id,
		updatedAt: node?.updatedAt?.toDate(),
		createdAt: node?.createdAt?.toDate(),
	});
}
export function getDocumentId(path?: string): string {
	if (!path) return "";

	// This assumes a simpler db structure
	const index = path?.indexOf("/");

	if (index >= 0) return path?.substring(index + 1);

	return path;
}

/**
 * Custom firebase indexing
 *
 * Implementation details
 * @see https://levelup.gitconnected.com/firestore-full-text-search-at-no-extra-cost-ee148856685
 *
 * Firebase compound queries limitations
 * @see https://firebase.google.com/docs/firestore/query-data/queries?hl=es-419#limitations_2
 */
export function triGram(strings: (string | undefined)[]) {
	const string = strings
		.filter(isNotUndefString)
		.map(deburr)
		.join(" ")
		.slice(0, 500)
		.toLowerCase();
	const indexes = [];
	const n = 5; // 5 letters words
	let k = 0;

	while (indexes.length <= 50 && k <= string.length - n) {
		indexes.push(string.substring(k, k + n));

		k += 2;
	}

	return indexes;
}
