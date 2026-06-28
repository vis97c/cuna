import { type H3Event, type EventHandlerRequest, getRequestURL, getQuery } from "h3";
import {
	type DocumentData,
	DocumentReference,
	DocumentSnapshot,
	QuerySnapshot,
	Query,
} from "firebase-admin/firestore";

import type { iPage, iPageEdge, tOrderBy } from "@open-xamu-co/ui-common-types";

import { makeResolveRefs } from "~/utils/resolver";
import type { iSnapshotConfig, PseudoDocumentSnapshot } from "~/utils/types";

import { getBoolean, isNumberOrString } from "../utils/guards";
import { apiLogger, getServerFirebase } from "./firebase";
import { debugFirebase } from "./environment";
import type { OutputFromData } from "~/utils/types/entities/base";
import type { FirebaseData } from "~~/functions/src/types/entities/base";
import type { H3Context } from "../types";
import { eMemberRole } from "~~/functions/src/types/entities";

export const decodeServerCursor = (cursor: string) =>
	Buffer.from(cursor, "base64").toString("utf8");
// base64 encode the snapshot's path
export const encodeServerCursor = (ref: DocumentReference) => {
	return Buffer.from(ref.path).toString("base64");
};

/**
 * Logging for debugging purposes on server
 */
export function debugFirebaseServer<T extends EventHandlerRequest>(
	event: H3Event<T>,
	mss: string,
	...args: any[]
) {
	if (import.meta.server && debugFirebase.value()) {
		const url = getRequestURL(event);

		console.group("\x1b[34m%s\x1b[0m", url);
		console.log(`${mss},`, ...args);
		console.groupEnd();
	}
}

/**
 * Resolve general refs
 */
export async function resolveServerRefs<
	T extends FirebaseData,
	R extends OutputFromData<T> = OutputFromData<T>,
>(
	event: H3Event,
	snapshot: PseudoDocumentSnapshot<T, R>,
	config: iSnapshotConfig = { level: 0, maxLevel: 2 },
	withAudit?: boolean
) {
	const { currentMember } = event.context as H3Context;
	const resolveRefs = makeResolveRefs((ref) => ref.get?.());
	const params = getQuery(event);

	// Use provided level if exists, otherwise use params.level or 0
	if (!config.level && params.level) {
		config.level = Array.isArray(params.level) ? 0 : Number(params.level);
	}

	// Use provided omit if exists, otherwise use params.omit or []
	if (!config.omit) config.omit = Array.isArray(params.omit) ? params.omit : [params.omit];

	// Get audit if assistant or bellow
	withAudit ??= (currentMember?.role ?? 3) <= eMemberRole.MODERATOR;

	return resolveRefs<T, R>(snapshot, config, withAudit);
}

/** Edge guard */
const isEdge = (e: iPageEdge<FirebaseData> | undefined): e is iPageEdge<FirebaseData> => !!e;

export async function mapEdges<T extends Record<string, any>>(
	event: H3Event,
	snapshots: PseudoDocumentSnapshot<T, any>[],
	encoder: (v: any) => string,
	snapshotConfig: iSnapshotConfig
) {
	// Awaited edges, run in parallel
	const edges: (iPageEdge<FirebaseData> | undefined)[] = await Promise.all(
		snapshots.map(async (document) => {
			const node = await resolveServerRefs(event, document, snapshotConfig);

			if (node) return { cursor: encoder(document.ref), node };
		})
	);

	return edges.filter(isEdge);
}

/**
 * Encapsulate the query resolution logic
 */
export class QueryResolver {
	private query: Query;

	/**
	 * Creates an instance of ResolveQuery
	 * @param event - The event to use for the query resolution
	 * @param query - The query to use for the query resolution
	 */
	constructor(
		private event: H3Event,
		query: Query,
		orderBy?: tOrderBy
	) {
		const params = getQuery<{ orderBy?: tOrderBy }>(this.event);
		const defaultOrderBy: tOrderBy = [
			params.orderBy?.[0] || "createdAt",
			params.orderBy?.[1] || "desc",
		];

		// Order the given query using the given orderBy parameter or default if not provided
		this.query = this.getOrderedQuery(query, orderBy || defaultOrderBy);
	}

	/**
	 * Order a query using the given order
	 * @param query - The query to use for the query resolution
	 */
	private getOrderedQuery(query: Query, [fieldName, order]: tOrderBy): Query {
		return query.orderBy(fieldName, order);
	}

	/**
	 * Get the edges from a given query
	 * @param query - The query to use for the query resolution
	 * @param callback - A callback to execute with the snapshot
	 */
	private async getEdges(
		query: Query = this.query,
		callback?: (v: QuerySnapshot<DocumentData>) => void | Promise<void>
	): Promise<iPageEdge<DocumentData, string>[]> {
		const params = getQuery(this.event);
		const page = getBoolean(params.page);
		const level = Array.isArray(params.level) || !params.level ? 0 : Number(params.level);
		const omit = Array.isArray(params.omit) ? params.omit : [params.omit];

		debugFirebaseServer(this.event, "getQueryAsEdges", { page, level, omit });

		// Prevent abusive callings (>100)
		if (!page) {
			const first = Math.min(Number(params.first) || 10, 100); // Page limit

			query = query.limit(first);
		}

		const snapshot = await query.get();

		// Do something with the snapshot, do not await
		Promise.resolve(callback?.(snapshot)).catch((err) => {
			// Log unhandled error
			apiLogger(this.event, "getQueryAsEdges:callback", err);
		});

		return mapEdges(this.event, snapshot.docs, encodeServerCursor, { level, omit });
	}

	/**
	 * Cursor pagination from a given query
	 * @param query - The query to use for the query resolution
	 */
	private async getEdgesPage(query: Query = this.query): Promise<iPage<DocumentData, string>> {
		const { firebaseFirestore } = getServerFirebase(`api:getEdgesPage:${this.event.path}`);
		const params = getQuery(this.event);
		/**
		 * Cursor or encoded cursor path.
		 *
		 * The number zero could be a cursor, validate against undefined
		 */
		const at = isNumberOrString(params.at) ? params.at : undefined;
		// Page limit. Prevent abusive callings (>=100)
		let first = Math.min(Number(params.first) || 10, 100);
		const page: iPage<DocumentData, string> = {
			edges: [],
			pageInfo: {
				hasNextPage: false,
				hasPreviousPage: false,
				pageNumber: 0,
				path: this.event.path,
			},
			totalCount: 0,
		};
		// Count all items in collection
		const aggregatorRef = query.count();
		let cursorRef = query; // Start collection at given cursor
		let startAtCursor: DocumentSnapshot | undefined;

		if (typeof at === "string") {
			// Awaited data, run in parallel
			const [aggregatorSnapshot, snapshot] = await Promise.all([
				aggregatorRef.get(),
				firebaseFirestore.doc(decodeServerCursor(at)).get(),
			]);
			const count = aggregatorSnapshot.data().count;

			first = Math.min(first, count);
			page.totalCount = count;

			if (snapshot.exists) {
				startAtCursor = snapshot;
				cursorRef = cursorRef.startAt(snapshot);
			}
		} else {
			// Use matching doc as cursor or fallback to at
			if (at !== undefined) cursorRef = cursorRef.startAt(at);

			const { count } = (await aggregatorRef.get()).data();

			first = Math.min(first, count);
			page.totalCount = count;
		}

		// Empty collection
		if (!page.totalCount) return page;

		const paginatedRef = cursorRef.limit(first + 1); // First n+1 items in collection after cursor

		// Has previous page?
		if (startAtCursor) {
			const previousPaginatedRef = query.endBefore(startAtCursor);
			const previousAggregatorRef = previousPaginatedRef.count(); // Estimate current page
			// Awaited data, run in parallel
			const [edges, previousCountRef, previousSnapshot] = await Promise.all([
				this.getEdges(paginatedRef),
				previousAggregatorRef.get(),
				previousPaginatedRef.limitToLast(first).get(),
			]);
			const { count } = previousCountRef.data();

			page.edges = edges;
			page.pageInfo.pageNumber = Math.floor(count / first) + 1;

			if (!previousSnapshot.empty) {
				page.pageInfo.hasPreviousPage = true;
				page.pageInfo.previousCursor = encodeServerCursor(previousSnapshot.docs[0].ref);
			}
		} else {
			// First page
			page.edges = await this.getEdges(paginatedRef);
			page.pageInfo.pageNumber = 1;
		}

		// Has next page?
		if (page.edges.length > first) {
			const nextEdge = page.edges.pop(); // Get last edge

			page.pageInfo.hasNextPage = !!nextEdge;
			page.pageInfo.nextCursor = nextEdge?.cursor;
		}

		return page;
	}

	resolve() {
		const params = getQuery(this.event);
		const page = getBoolean(params.page);

		if (page) return this.getEdgesPage(this.query);

		return this.getEdges(this.query);
	}
}
