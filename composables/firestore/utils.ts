import {
	type DocumentData,
	type DocumentSnapshot,
	type SnapshotOptions,
	type CollectionReference,
	type DocumentReference,
	type QueryDocumentSnapshot,
} from "firebase/firestore";

/**
 * Logging for debugging purposes on client
 */
export function debugFirebaseClient(mss: string, ...args: any[]) {
	const { debugFirebase } = useRuntimeConfig().public;

	if (debugFirebase && process.client) console.debug(`Client: ${mss},`, ...args);
}

/**
 * Collection converter.
 *
 * @see https://firebase.google.com/docs/reference/js/v8/firebase.firestore.FirestoreDataConverter
 */
export function ConvertCollection<V extends Record<string, any>>(collRef: CollectionReference) {
	return collRef.withConverter({
		toFirestore(v: V): DocumentData {
			return v;
		},
		fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): V {
			return snapshot.data(options) as V;
		},
	});
}
/**
 * Document converter.
 *
 * @see https://firebase.google.com/docs/reference/js/v8/firebase.firestore.FirestoreDataConverter
 */
export function ConvertDocument<V extends Record<string, any>>(docRef: DocumentReference) {
	return docRef.withConverter({
		toFirestore(v: V): DocumentData {
			return v;
		},
		fromFirestore(snapshot: DocumentSnapshot<DocumentData>, options: SnapshotOptions): V {
			return snapshot.data(options) as V;
		},
	});
}
