import {
	DocumentReference,
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	setDoc,
	onSnapshot,
	CollectionReference,
} from "firebase/firestore";

import type { SharedDocument, GetRef } from "~/resources/types/entities";
import { getDocumentId } from "~/resources/utils/firestore";
import { TimedPromise } from "~/resources/utils/promises";

/** Creates document with the given values */
export async function useDocumentCreate<
	V extends Record<string, any>,
	Vgr extends GetRef<V> = GetRef<V>,
>(
	collectionId: string,
	{ id, ...middleRef }: Vgr & { id?: string },
	createdCallback?: (ref: DocumentReference<Vgr>) => Promise<void> | void
): Promise<DocumentReference<Vgr> | undefined> {
	const SESSION = useSessionStore();
	const { $clientFirestore } = useNuxtApp();

	if (import.meta.server || !$clientFirestore) return;

	// get collection ref
	const collectionRef = <CollectionReference<Vgr>>collection($clientFirestore, collectionId);
	const partialRef = <Vgr>middleRef;
	let createdRef: DocumentReference<Vgr>;

	if (SESSION.id) {
		const createdByRef = doc($clientFirestore, SESSION.id);

		partialRef.createdByRef = partialRef.updatedByRef = createdByRef;
	}

	delete partialRef.createdAt;
	delete partialRef.updatedAt;

	if (id) {
		createdRef = doc(collectionRef, getDocumentId(id));

		await setDoc(createdRef, partialRef, { merge: true });
	} else createdRef = await addDoc(collectionRef, partialRef);

	try {
		// Perform additional actions with the new document
		await createdCallback?.(createdRef);

		// Wait for cloud function snapshot
		return TimedPromise((resolve, reject) => {
			const unsub = onSnapshot(
				createdRef,
				async (snapshot) => {
					// Cloud function should inject timestamps
					if (!snapshot.data()?.createdAt) return;

					unsub();
					resolve(snapshot.ref);
				},
				reject
			);
		}, createdRef);
	} catch (err) {
		useLogger("composables:useDocumentCreate", err);

		return createdRef;
	}
}

/**
 * Updates a given document in Firestore.
 *
 * @param node - The existing document to update.
 * @param partialRef - The partial data to update the document with.
 * @returns A boolean promise.
 */
export async function useDocumentUpdate<
	V extends Record<string, any>,
	Vgr extends GetRef<V> = GetRef<V>,
>(node: SharedDocument, middleRef: Partial<Vgr> = {}): Promise<boolean> {
	const SESSION = useSessionStore();
	const { $clientFirestore } = useNuxtApp();

	if (import.meta.server || !$clientFirestore) return false;

	const docRef = <DocumentReference<Vgr>>doc($clientFirestore, node.id || ""); // get node ref
	const partialRef = <Vgr>middleRef;
	const lastUpdatedAt = node.updatedAt ? new Date(node.updatedAt).getTime() : 0;

	if (SESSION.id) {
		const updatedByRef = doc($clientFirestore, SESSION.id);

		partialRef.updatedByRef = updatedByRef;
	}

	delete partialRef.createdAt;
	delete partialRef.updatedAt;

	await setDoc(docRef, partialRef, { merge: true });

	// Wait for cloud function snapshot
	return TimedPromise((resolve, reject) => {
		const unsub = onSnapshot(
			docRef,
			async (snapshot) => {
				const updatedAt = snapshot.data()?.updatedAt?.toMillis() ?? 0;

				// Cloud function should update timestamps
				if (lastUpdatedAt >= updatedAt) return;

				unsub();
				resolve(true);
			},
			reject
		);
	}, false);
}

/** Clones given document */
export async function useDocumentClone<
	V extends Record<string, any>,
	Vgr extends GetRef<V> = GetRef<V>,
>(node: SharedDocument, middleRef: Partial<Vgr> = {}): Promise<boolean> {
	const { $clientFirestore } = useNuxtApp();
	const SESSION = useSessionStore();

	if (import.meta.server || !$clientFirestore) return false;

	const path = node.id || "";
	const docRef = <DocumentReference<Vgr>>doc($clientFirestore, path);
	const data = (await getDoc(docRef)).data();
	const partialRef = <Vgr>middleRef;

	if (!data) return false;
	if (SESSION.id) {
		const createdByRef = doc($clientFirestore, SESSION.id);

		partialRef.createdByRef = partialRef.updatedByRef = createdByRef;
	}

	delete data.createdAt;
	delete data.updatedAt;
	delete partialRef.createdAt;
	delete partialRef.updatedAt;

	const collectionRef = docRef.parent;
	const clonedDoc = await addDoc(collectionRef, { ...data, ...partialRef });

	// Wait for cloud function snapshot
	return TimedPromise((resolve, reject) => {
		const unsub = onSnapshot(
			clonedDoc,
			async (snapshot) => {
				// Cloud function should inject timestamps
				if (!snapshot.data()?.createdAt) return;

				unsub();
				resolve(true);
			},
			reject
		);
	}, false);
}

/** Deletes given document */
export async function useDocumentDelete(node: SharedDocument): Promise<boolean> {
	const { $clientFirestore } = useNuxtApp();

	if (import.meta.server || !$clientFirestore) return false;

	const path = node.id || "";
	const docRef = doc($clientFirestore, path);

	await deleteDoc(docRef);

	// Wait for cloud function snapshot
	return TimedPromise((resolve, reject) => {
		const unsub = onSnapshot(
			docRef,
			async (snapshot) => {
				// Confirm deletion
				if (snapshot.exists()) return;

				unsub();
				resolve(true);
			},
			reject
		);
	}, false);
}
