import type { FirebaseData } from "~~/functions/src/types/entities/base";

import type { PseudoDocumentSnapshot, PseudoDocumentReference, iSnapshotConfig } from "./types";
import type { OutputFromData } from "./types/entities/base";

/** Cached document */
interface iCachedDocument<
	T extends FirebaseData = FirebaseData,
	R extends OutputFromData<T> = OutputFromData<T>,
> {
	/** Original snapshot */
	snapshot: PseudoDocumentSnapshot<T, R>;
	/** Resolved data*/
	data: R;
}

/**
 * Get document ID from a firebase path
 *
 * @param path Path to resolve "instances/...".
 * @returns Document ID
 */
export function getDocumentId(path = ""): string {
	// This assumes a simpler db structure
	return path.split("/").pop() || "";
}

/** Timestamp breaks nuxt */
export function resolveSnapshotDefaults<
	T extends FirebaseData,
	R extends OutputFromData<T> = OutputFromData<T>,
>(id: string, node?: T, withAudit = false): R {
	if (!node) return {} as R;

	const dateFields: Record<string, Date> = {};

	for (const key in node) {
		// TODO: match against any field of date type
		if (
			key.endsWith("At") &&
			node[key] &&
			typeof node[key] === "object" &&
			"toDate" in node[key]
		) {
			dateFields[key] = node[key]?.toDate();
		}

		// Remove sensitive data if not authorized
		if (!withAudit && ["documentNumber", "cellphoneNumber"].includes(key)) {
			delete node[key];
		}
	}

	return Object.assign({}, node, { id, ...dateFields }) as unknown as R;
}

/**
 * Get a document snapshot from a reference
 */
type Resolver = <Tr extends FirebaseData, Rr extends OutputFromData<Tr> = OutputFromData<Tr>>(
	ref: PseudoDocumentReference<Tr, Rr>
) => Promise<PseudoDocumentSnapshot<Tr, Rr>>;

/**
 * Get object from firebase snapshot
 */
export function makeResolveRefs(resolver: Resolver) {
	/**
	 * Resolve refs from a snapshot recursively
	 */
	return async function resolveRefs<
		T extends FirebaseData,
		R extends OutputFromData<T> = OutputFromData<T>,
	>(
		snapshot: PseudoDocumentSnapshot<T, R>,
		{ level: desiredLevel = 0, maxLevel = 2, omit = [] }: iSnapshotConfig = {},
		withAudit = false
	): Promise<R | undefined> {
		/** Store documents for caching */
		const cache: Record<string, Record<number, any>> = {};
		/** Prevent abusive callings by limiting the level */
		const level = Math.min(desiredLevel, maxLevel);
		const cached: iCachedDocument<T, R> | undefined = cache[snapshot.ref.path]?.[level];

		// Return cached data if available and snapshot is equal
		if (cached && snapshot.isEqual(cached.snapshot)) return cached.data;

		const exists = typeof snapshot.exists === "function" ? snapshot.exists() : snapshot.exists;

		// Omit if non-existent
		if (!exists) return;

		type kT = Extract<keyof T, string>;

		const node = snapshot.data() || <T>{};

		// Omit if deletedByRef present
		if (node.deletedByRef) return;

		// Clear deprecated refs
		delete node.userRef;
		delete node.rootMemberRef;

		const path = snapshot.ref.path;
		const keys = Object.keys(node || {}) as kT[];

		// Resolve all nested refs in parallel
		await Promise.all(
			keys.map(async (key) => {
				if (!Object.hasOwn(node, key)) return;

				const newKey = <kT>key.replace(/(Ref|Refs)$/, "");
				const innerOmit = omit.reduce<string[]>((acc, k) => {
					// Filter omit keys
					if (k?.startsWith(newKey)) acc.push(k.replace(`${newKey}.`, ""));

					return acc;
				}, []);

				// Transform firebase paths
				// TODO: match against any field of type ref or ref[]
				// Current implementations relies in proper naming
				if (key.endsWith("Ref")) {
					const ref = <PseudoDocumentReference<FirebaseData>>node[key];

					// Omit user if non authorized
					if (!omit.includes(newKey) && typeof ref === "object" && ref !== null) {
						let innerLevel = level;

						if (innerLevel > 0) {
							// Prevent infinite fetching loop, single ref
							if (path === ref.path) {
								delete node[key];

								return;
							}

							// Conditionally get audit data
							if (["createdByRef", "updatedByRef", "deletedByRef"].includes(key)) {
								innerLevel = Math.max(innerLevel, 2);

								// Omit audit data if non authorized
								if (!withAudit) {
									delete node[key];

									return;
								}
							}

							// Prevent infinite fetching loop, single ref
							const innerSnapshot = await resolver(ref); // node

							if (innerSnapshot) {
								const resolved = await resolveRefs(
									innerSnapshot,
									{ level: Math.max(0, innerLevel - 1), omit: innerOmit },
									withAudit
								);

								// Typescript nonsense
								node[newKey] = <T[kT]>resolved;
							}
						}
					}

					delete node[key];
				} else if (key.endsWith("Refs")) {
					const nodes = <PseudoDocumentReference<FirebaseData>[]>node[key];
					const refs: OutputFromData<FirebaseData>[] = [];

					// Prevent infinite fetching loop
					if (level > 0 && !omit.includes(newKey) && Array.isArray(nodes)) {
						let innerLevel = level;

						// Conditionally get audit data
						if (["createdByRef", "updatedByRef", "deletedByRef"].includes(key)) {
							innerLevel = Math.max(innerLevel, 2);

							// Omit audit data if non authorized
							if (!withAudit) {
								delete node[key];

								return;
							}
						}

						// Resolve all refs in parallel
						await Promise.all(
							nodes.map(async (ref) => {
								// Bypass invalid ref
								if (typeof ref !== "object" || ref === null) return;
								// Prevent infinite fetching loop, single ref
								if (path === ref.path) return;

								const innerSnapshot = await resolver(ref); // node
								const data = innerSnapshot?.data();

								if (!innerSnapshot || !data) return;

								const resolved = await resolveRefs(
									innerSnapshot,
									{ level: Math.max(0, innerLevel - 1), omit: innerOmit },
									withAudit
								);

								if (resolved) refs.push(resolved);
							})
						);

						// typescript nonsense
						node[newKey] = <T[kT]>refs;
					}

					delete node[key];
				} else if (!key.endsWith("At") && node[key] && typeof node[key] === "object") {
					if (0 in node[key]) {
						// Fix array shaped object
						const dataArr = Object.values(node[key]).map((data) => {
							if (typeof data !== "object" || data === null) return data;

							const { id, ...newData } = resolveSnapshotDefaults("", data, withAudit);

							return newData;
						});

						node[key] = <T[kT]>dataArr;
					} else {
						// Prevent non serializable inherits from being returned
						const { id, ...newData } = resolveSnapshotDefaults(
							"",
							node[key],
							withAudit
						);

						node[key] = <T[kT]>newData;
					}
				}
			})
		);

		// Fix defaults (date fields)
		const data = resolveSnapshotDefaults<T, R>(path, node, withAudit);

		// Store in cache
		cache[snapshot.ref.path] ||= {};
		cache[snapshot.ref.path][level] = { snapshot, data };

		return data;
	};
}
