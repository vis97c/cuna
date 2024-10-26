import { type QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
	onDocumentDeleted,
	onDocumentCreated,
	onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import type { FirebaseData } from "../types/entities";

/**
 * Adds timestamps
 * @param collectionId target collection
 * @param callback optional callback fn
 * @returns firebase function
 */
export function onCreated<T extends FirebaseData>(
	collectionId: string,
	callback?: (newDoc: QueryDocumentSnapshot<T>) => Promise<Partial<T> | undefined | void>,
	overrides: Partial<T> = {}
) {
	return onDocumentCreated(
		{ document: `${collectionId}/{documentId}`, region: "us-east1" },
		async (event) => {
			const newDoc = <QueryDocumentSnapshot<T> | undefined>event.data;
			const createdAt = new Date();

			if (!newDoc) return null;

			// additional tasks
			const callbackData = await callback?.(newDoc);

			return newDoc.ref.set(
				{
					...callbackData,
					...overrides,
					createdAt,
					updatedAt: createdAt,
				},
				{ merge: true }
			);
		}
	);
}
/**
 * Updates timestamp
 * @param collectionId target collection
 * @param callback optional callback fn
 * @returns firebase function
 */
export function onUpdated<T extends FirebaseData>(
	collectionId: string,
	callback?: (
		newDoc: QueryDocumentSnapshot<T>,
		oldDoc: QueryDocumentSnapshot<T>
	) => Promise<Partial<T> | undefined | void>,
	overrides: Partial<T> = {}
) {
	return onDocumentUpdated(
		{ document: `${collectionId}/{documentId}`, region: "us-east1" },
		async (event) => {
			const newDoc = <QueryDocumentSnapshot<T> | undefined>event.data?.after;
			const oldDoc = <QueryDocumentSnapshot<T> | undefined>event.data?.before;
			const updatedAt = new Date();

			if (!newDoc || !oldDoc) return null;

			const { updatedAt: oldUpdatedAt } = newDoc.data();
			const { updatedAt: newUpdatedAt } = oldDoc.data();

			// already updated
			if (!oldUpdatedAt || !newUpdatedAt || !newUpdatedAt.isEqual(oldUpdatedAt)) return null;

			// additional tasks
			const callbackData = await callback?.(newDoc, oldDoc);

			return newDoc.ref.set({ ...callbackData, ...overrides, updatedAt }, { merge: true });
		}
	);
}
/**
 * Runs callback after document has been removed
 * @param collectionId target collection
 * @param callback callback fn
 * @returns firebase function
 */
export function onDelete<T extends FirebaseData>(
	collectionId: string,
	callback: (deletedDoc: QueryDocumentSnapshot<T>) => void
) {
	return onDocumentDeleted(
		{ document: `${collectionId}/{documentId}`, region: "us-east1" },
		async (event) => {
			const deletedDoc = <QueryDocumentSnapshot<T> | undefined>event.data;

			if (!deletedDoc) return null;

			return callback(deletedDoc);
		}
	);
}
