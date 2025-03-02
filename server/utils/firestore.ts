import type { H3Event, EventHandlerRequest } from "h3";
import {
	type DocumentData,
	DocumentReference,
	DocumentSnapshot,
	Query,
} from "firebase-admin/firestore";
import { QuerySnapshot } from "@google-cloud/firestore";

import type { iPage, iPageEdge, tOrderBy } from "@open-xamu-co/ui-common-types";

import type { iSnapshotConfig, PseudoNode } from "~/resources/types/firestore";
import type { FirebaseDocument } from "~/resources/types/entities";
import { isNumberOrString } from "~/resources/utils/guards";
import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
import { getBoolean } from "~/resources/utils/node";

const decodeCursor = (cursor: string) => Buffer.from(cursor, "base64").toString("utf8");
// base64 encode the snapshot's path
const encodeCursor = (ref: DocumentReference) => {
	return Buffer.from(ref.path).toString("base64");
};

/**
 * Get object from firebase node
 *
 * Consider using it as a converter
 *
 * @param path node firebase path
 * @param node firebase node
 * @param level get nested refs
 * @returns {Object} desired object
 */
export async function resolveSnapshotRefs<T extends PseudoNode>(
	snapshot: DocumentSnapshot<T>,
	{ level = 0, omit = [] }: iSnapshotConfig
): Promise<FirebaseDocument> {
	const node = snapshot.data();
	const path = snapshot.ref.path;

	for (const key in node) {
		if (!Object.hasOwn(node, key)) continue;

		const newKey: keyof T = key.replace(/(Ref|Refs)$/, "");
		const innerOmit = omit
			.filter((k) => k && k.startsWith(newKey))
			.map((k) => k.replace(`${newKey.toString()}.`, ""));

		// transform firebase paths
		if (key.endsWith("Ref")) {
			const ref: DocumentReference = node[key];

			// omit author metadata
			// TODO: allow if authorized (role<3)
			if (!newKey.endsWith("By")) {
				// Prevent infinite fetching loop

				if (
					level > 0 &&
					!omit.includes(newKey) &&
					typeof ref === "object" &&
					ref !== null
				) {
					// single ref
					const snapshot = await ref.get(); // node

					if (snapshot) {
						const resolved = await resolveSnapshotRefs(snapshot, {
							level: level - 1,
							omit: innerOmit,
						});

						node[newKey] = <T[keyof T]>resolved;
					}
				}
			}

			delete node[key];
		} else if (key.endsWith("Refs")) {
			const nodes: DocumentReference[] = node[key];

			// Prevent infinite fetching loop
			if (level > 0 && !omit.includes(newKey) && Array.isArray(nodes)) {
				// ref array
				const refs = await Promise.all(
					nodes.map(async (ref) => {
						// bypass invalid ref
						if (typeof ref !== "object" || ref === null) return;

						const snapshot = await ref.get(); // node
						const data = snapshot.data();

						if (!snapshot || !data) return;

						return resolveSnapshotRefs(snapshot, {
							level: Math.max(0, level - 1),
							omit: innerOmit,
						});
					})
				);

				// typescript nonsense
				node[newKey] = <T[keyof T]>refs.filter((ref) => ref);
			}

			delete node[key];
		}
	}

	return resolveSnapshotDefaults(path, node);
}

export async function mapEdges<T extends Record<string, any>>(
	collectionSnapshot: QuerySnapshot<T>,
	encoder: (v: any) => string,
	snapshotConfig: iSnapshotConfig
) {
	const edges: iPageEdge<FirebaseDocument>[] = [];

	for (let i = 0; i < collectionSnapshot.docs.length; i++) {
		const document = collectionSnapshot.docs[i];
		const node = await resolveSnapshotRefs(document, snapshotConfig);

		edges.push({ cursor: encoder(document.ref), node });
	}

	return edges;
}

export function getOrderedQuery<T extends EventHandlerRequest>(
	event: H3Event<T>,
	strOrQry: string | Query
): Query {
	const { serverFirestore } = getServerFirebase();
	const params = getQuery<{ orderBy?: tOrderBy[] }>(event);
	const query = typeof strOrQry === "string" ? serverFirestore.collection(strOrQry) : strOrQry;
	const orderByParam = Array.isArray(params.orderBy?.[0]) ? params.orderBy[0] : [];
	const orderByValues: tOrderBy = [orderByParam[0] ?? "createdAt", orderByParam[1] ?? "desc"];

	return query.orderBy(...orderByValues);
}

/**
 * Get the edges from a given query
 */
export async function getQueryAsEdges<T extends EventHandlerRequest>(
	event: H3Event<T>,
	query: Query,
	callback?: (v: QuerySnapshot<DocumentData>) => void | Promise<void>
): Promise<iPageEdge<DocumentData, string>[]> {
	const params = getQuery(event);
	const page = getBoolean(params.page);
	const level = Array.isArray(params.level) || !params.level ? 0 : Number(params.level);
	const omit = Array.isArray(params.omit) ? params.omit : [params.omit];

	debugFirebaseServer(event, "getQueryAsEdges", params);

	// Prevent abusive callings (>100)
	if (!page) query = query.limit(100);

	const snapshot = await query.get();

	// do something with the snapshot
	await callback?.(snapshot);

	return mapEdges(snapshot, encodeCursor, { level, omit });
}

export async function getEdgesPage<T extends EventHandlerRequest>(
	event: H3Event<T>,
	query: Query
): Promise<iPage<DocumentData, string>> {
	const { serverFirestore } = getServerFirebase();
	const params = getQuery(event);
	/**
	 * Cursor or encoded cursor path.
	 *
	 * The number zero could be a cursor, validate against undefined
	 */
	const at = isNumberOrString(params.at) ? params.at : undefined;
	// Count all items in collection
	const aggregatorSnapshot = await query.count().get();
	const count = aggregatorSnapshot.data().count;
	// Prevent abusive callings (>100)
	const first = Math.min(Number(params.first) || Math.min(10, count), 100); // Page limit
	const page: iPage<DocumentData, string> = {
		edges: [],
		pageInfo: {
			hasNextPage: false,
			hasPreviousPage: false,
			path: event.path,
		},
		totalCount: count || 0,
	};

	// empty collection
	if (!page.totalCount) return page;

	let cursorRef = query; // start collection at given cursor

	if (at !== undefined) {
		let cursor: DocumentSnapshot | string | number = at;

		if (typeof at == "string") {
			const snapshot = await serverFirestore.doc(decodeCursor(at)).get();

			if (snapshot.exists) cursor = snapshot;
		}

		// Use matching doc as cursor or fallback to at
		cursorRef = cursorRef.startAt(cursor);
	}

	const paginatedRef = cursorRef.limit(first + 1); // First n+1 items in collection after cursor

	page.edges = await getQueryAsEdges(event, paginatedRef, async (snapshot) => {
		// is first page
		if (at === undefined) return;

		const previousPaginatedRef = query.endBefore(snapshot.docs[0]).limit(first); // end collection before given cursor

		await getQueryAsEdges(event, previousPaginatedRef, async (previousSnapshot) => {
			// no items in previous page
			if (previousSnapshot.size !== first) return;

			const previousCursor = previousSnapshot.docs.shift()?.data();

			page.pageInfo.hasPreviousPage = !!previousCursor;
			page.pageInfo.previousCursor = previousCursor?.cursor;
		});
	});

	// has next page
	if (page.edges.length > first) {
		const nextCursor = page.edges.pop();

		page.pageInfo.hasNextPage = !!nextCursor;
		page.pageInfo.nextCursor = nextCursor?.cursor;
	}

	return page;
}
