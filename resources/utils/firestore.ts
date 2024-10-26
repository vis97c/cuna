import type { FirebaseDocument } from "../types/entities";
import type { PseudoNode } from "../types/firestore";

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
