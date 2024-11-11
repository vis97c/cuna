import {
	DocumentReference,
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	setDoc,
	onSnapshot,
} from "firebase/firestore";

import type { SharedDocument, GetRef } from "~/resources/types/entities";
import { getDocumentId } from "~/resources/utils/firestore";
import { ConvertCollection, ConvertDocument } from "./utils";
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
	if (process.server) return;

	const SESSION = useSessionStore();
	const { $clientFirestore } = useNuxtApp();
	// get collection ref
	const collectionRef = ConvertCollection<Vgr>(collection($clientFirestore, collectionId));
	const partialRef = <Vgr>middleRef;

	if (SESSION.id) {
		const createdByRef = doc($clientFirestore, SESSION.id);

		partialRef.createdByRef = partialRef.updatedByRef = createdByRef;
	}

	let createdRef: DocumentReference<Vgr>;

	if (id) {
		createdRef = doc(collectionRef, getDocumentId(id));

		await setDoc(createdRef, partialRef, { merge: true });
	} else createdRef = await addDoc<Vgr>(collectionRef, partialRef);

	try {
		// Perform additional actions with the new document
		await createdCallback?.(createdRef);

		// Wait for cloud function snapshot
		return TimedPromise((resolve, reject) => {
			const unsub = onSnapshot<Vgr>(
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
		console.log(err);

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
>(node: SharedDocument, partialRef: Partial<Vgr> = {}): Promise<boolean> {
	if (process.server) return false;

	const SESSION = useSessionStore();
	const { $clientFirestore } = useNuxtApp();
	const docRef = ConvertDocument<Vgr>(doc($clientFirestore, node.id || "")); // get node ref
	const updatedByRef = doc($clientFirestore, SESSION.id);
	const lastUpdatedAt = node.updatedAt ? new Date(node.updatedAt).getTime() : 0;

	await setDoc(docRef, { ...partialRef, updatedByRef }, { merge: true });

	// Wait for cloud function snapshot
	return TimedPromise((resolve, reject) => {
		const unsub = onSnapshot<Vgr>(
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
>(node: SharedDocument, partialRef: Partial<Vgr> = {}): Promise<boolean> {
	if (process.server) return false;

	const { $clientFirestore } = useNuxtApp();
	const SESSION = useSessionStore();
	const path = node.id || "";
	const docRef = ConvertDocument<Vgr>(doc($clientFirestore, path));
	const data = (await getDoc(docRef)).data();

	if (!data) return false;

	delete data.createdAt;
	delete data.updatedAt;

	const collectionRef = docRef.parent;
	const createdByRef = doc($clientFirestore, SESSION.id);
	const clonedDoc = await addDoc(collectionRef, {
		...data,
		...partialRef,
		createdByRef,
		updatedByRef: createdByRef,
	});

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
	if (process.server) return false;

	const { $clientFirestore } = useNuxtApp();
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
