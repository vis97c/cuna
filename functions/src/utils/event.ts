import { Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
	onDocumentDeleted,
	onDocumentCreated,
	onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule as onScheduleV2 } from "firebase-functions/v2/scheduler";
import { onTaskDispatched, type Request } from "firebase-functions/tasks";
import omit from "lodash-es/omit.js";
import isEqual from "lodash-es/isEqual.js";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import type { AuditData } from "../types/entities/member.js";
import { getFirebase } from "./firebase.js";
import { makeFunctionsLogger } from "./logger.js";

/**
 * Get document path
 *
 * @param collectionPath target collection (collection/optionalsubcollection)
 * @returns document path
 */
function getDocumentPath(collectionPath: string) {
	const [collection, ...subCollections] = collectionPath.split("/");
	const initialPath = `${collection}/{documentId}`;

	return subCollections.reduce((acc, current, currentIndex) => {
		return `${acc}/${current}/{document${currentIndex + 1}Id}`;
	}, initialPath);
}

interface OnCreatedOptions<T extends AuditData> {
	/**
	 * Fields to exclude from the new document
	 */
	exclude?: (keyof T)[];
	/**
	 * Default values when not provided
	 */
	defaults?: Partial<T>;
}

/**
 * Adds timestamps
 *
 * If the callback throws an error the document will be deleted
 *
 * @param collectionPath target collection (collection/optionalsubcollection)
 * @param callback optional callback fn
 * @returns firebase function
 */
export function onCreated<T extends AuditData>(
	collectionPath: string,
	callback?: (
		newDoc: QueryDocumentSnapshot<T>,
		utils: { createdAt: Date; logger: tLogger }
	) => Partial<T> | undefined | void | Promise<Partial<T> | undefined | void>,
	{ defaults = {}, exclude = [] }: OnCreatedOptions<T> = {}
) {
	/** Match a document path */
	const document = getDocumentPath(collectionPath);

	return onDocumentCreated({ document, region: "us-east1" }, async ({ data, ...metadata }) => {
		const { firebaseFirestore } = getFirebase(`onCreated: "${document}"`);
		const newDoc = <QueryDocumentSnapshot<T> | undefined>data;

		if (!newDoc) return null;

		const newDocData = newDoc.data() || {};
		const { createdByRef, createdAt = Timestamp.now() } = newDocData;
		/**
		 * Prefer parent instance for logging
		 *
		 * @path instances/{instanceId}/members/{memberId}
		 */
		const at = createdByRef?.parent.parent || firebaseFirestore;
		const logger = makeFunctionsLogger(at, createdByRef, metadata);

		try {
			// Perform additional tasks
			const callbackData = await callback?.(newDoc, {
				createdAt: createdAt.toDate(),
				logger,
			});

			return newDoc.ref.set(
				{
					...defaults,
					...omit(newDocData, exclude),
					...callbackData,
					createdAt,
					updatedAt: createdAt,
				},
				{ merge: true }
			);
		} catch (err) {
			// Remove document, logging handled on error source
			return newDoc.ref.delete();
		}
	});
}

interface OnUpdatedOptions<T extends AuditData> {
	/**
	 * Default values when not provided
	 */
	defaults?: Partial<T>;
}

const ignoreKeys = [
	"updatedAt",
	"updatedBy",
	"updatedByRef",
	"createdAt",
	"createdBy",
	"createdByRef",
	"deletedBy",
	"deletedByRef",
];

/**
 * Updates timestamp
 *
 * @param collectionPath target collection (collection/optionalsubcollection)
 * @param callback optional callback fn
 * @returns firebase function
 */
export function onUpdated<T extends AuditData>(
	collectionPath: string,
	callback?: (
		newDoc: QueryDocumentSnapshot<T>,
		oldDoc: QueryDocumentSnapshot<T>,
		utils: { updatedAt: Date; logger: tLogger }
	) => Partial<T> | undefined | void | Promise<Partial<T> | undefined | void>,
	{ defaults = {} }: OnUpdatedOptions<T> = {}
) {
	/** Match a document path */
	const document = getDocumentPath(collectionPath);

	return onDocumentUpdated({ document, region: "us-east1" }, async ({ data, ...metadata }) => {
		const { firebaseFirestore } = getFirebase(`onUpdated: "${document}"`);
		const updatedAt = new Date();
		const newDoc = <QueryDocumentSnapshot<T> | undefined>data?.after;
		const oldDoc = <QueryDocumentSnapshot<T> | undefined>data?.before;

		if (!newDoc || !oldDoc) return null;

		const { createdAt: newCreatedAt, updatedByRef, deletedByRef, lock } = newDoc.data();
		const { createdAt: oldCreatedAt = newCreatedAt } = oldDoc.data();
		/**
		 * Prefer parent instance for logging
		 *
		 * @path instances/{instanceId}/members/{memberId}
		 */
		const at = updatedByRef?.parent.parent || firebaseFirestore;
		const logger = makeFunctionsLogger(at, updatedByRef, metadata);

		// Delete document. Locked documents cannot be deleted from the client
		if (deletedByRef && (!lock || (Array.isArray(lock) && !lock.length))) {
			return newDoc.ref.delete();
		}

		const oldFunctional = omit(oldDoc.data(), ignoreKeys);
		const newFunctional = omit(newDoc.data(), ignoreKeys);

		if (isEqual(oldFunctional, newFunctional)) return null;

		// Additional tasks
		const callbackData = await callback?.(newDoc, oldDoc, { updatedAt, logger });

		// Update document, preserve createdAt
		return newDoc.ref.set(
			{ ...defaults, ...callbackData, updatedAt, createdAt: oldCreatedAt },
			{ merge: true }
		);
	});
}
/**
 * Runs callback after document has been removed
 *
 * @param collectionPath target collection (collection/optionalsubcollection)
 * @param callback callback fn
 * @returns firebase function
 */
export function onDeleted<T extends AuditData>(
	collectionPath: string,
	callback: (
		deletedDoc: QueryDocumentSnapshot<T>,
		utils: { deletedAt: Date; logger: tLogger }
	) => void
) {
	/** Match a document path */
	const document = getDocumentPath(collectionPath);

	return onDocumentDeleted({ document, region: "us-east1" }, async ({ data, ...metadata }) => {
		const { firebaseFirestore } = getFirebase(`onDeleted: "${document}"`);
		const deletedAt = new Date();
		const deletedDoc = <QueryDocumentSnapshot<T> | undefined>data;
		const { deletedByRef } = deletedDoc?.data() || {};
		/**
		 * Prefer parent instance for logging
		 *
		 * @path instances/{instanceId}/members/{memberId}
		 */
		const at = deletedByRef?.parent.parent || firebaseFirestore;
		const logger = makeFunctionsLogger(at, deletedByRef, metadata);

		if (!deletedDoc) return null;

		return callback(deletedDoc, { deletedAt, logger });
	});
}

/**
 * Runs callback at given schedule
 *
 * @param schedule The schedule in Unix Crontab or AppEngine syntax
 * @param callback callback fn
 * @returns firebase function
 */
export function onSchedule(schedule: string, callback: () => Promise<void> | void) {
	return onScheduleV2({ schedule, region: "us-east1", timeZone: "America/Bogota" }, callback);
}

/**
 * Runs callback at task dispatch
 *
 * @param callback callback fn
 * @returns firebase function
 */
export function onDispatch<T extends Record<string, any>>(
	callback: (request: Request<T>) => Promise<void> | void
) {
	return onTaskDispatched<T>(
		{
			retryConfig: { maxAttempts: 2, minBackoffSeconds: 60 },
			rateLimits: { maxConcurrentDispatches: 100 },
			region: "us-east1",
		},
		callback
	);
}
