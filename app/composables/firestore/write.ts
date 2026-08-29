import {
	DocumentReference,
	addDoc,
	collection,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	CollectionReference,
	type UpdateData,
} from "firebase/firestore";
import set from "lodash-es/set";
import isPlainObject from "lodash-es/isPlainObject";

import type { iNodeFnResponse } from "@open-xamu-co/ui-common-types";

import type { iSnapshotConfig } from "~/utils/types";
import type { InputFromData, OutputFromData, RefFromData } from "~/utils/types/entities/base";
import type { AuditData } from "~~/functions/src/types/entities";

interface iUseDocumentOptions extends iSnapshotConfig {
	omitLoggings?: boolean;
}

/** Helper to remove undefined properties recursively */
export function removeUndefinedProperties<T extends Record<string, any>>(obj: T): T {
	for (const key in obj) {
		if (obj[key] === undefined) {
			delete obj[key];
		} else if (isPlainObject(obj[key])) {
			removeUndefinedProperties(obj[key]);
		}
	}

	return obj;
}

/** Creates document with the given values */
export async function useDocumentCreate<
	Data extends AuditData,
	Vgr extends InputFromData<Data> = InputFromData<Data>,
	V extends OutputFromData<Data> = OutputFromData<Data>,
>(
	collectionPath: string,
	partialRef: Vgr,
	createdCallback?: (ref: DocumentReference<RefFromData<Data>>) => Promise<void> | void,
	{ omitLoggings, ...config }: iUseDocumentOptions = { omitLoggings: false, level: 0 }
): Promise<iNodeFnResponse<V>> {
	const SESSION = useSessionStore();
	const { $clientFirestore, $resolveClientRefs } = useNuxtApp();

	if (!collectionPath || !$clientFirestore) throw new Error("Collection path is required");

	const collRef = <CollectionReference<Data, V>>collection($clientFirestore, collectionPath); // get collection ref

	// Conditionally inject member information
	if (SESSION.path) {
		const createdByRef = doc($clientFirestore, SESSION.path);

		partialRef.createdByRef = partialRef.updatedByRef = createdByRef;
	}

	// Set timestamps
	partialRef.createdAt = partialRef.updatedAt = new Date();

	// Remove any undefined properties before writing to firestore
	removeUndefinedProperties(partialRef);

	let createdRef: DocumentReference<Data, V> | undefined;

	try {
		if (partialRef.id) {
			createdRef = doc(collRef, getDocumentId(partialRef.id));

			// Set document
			await setDoc(createdRef, partialRef as unknown as Data, { merge: true });
		} else createdRef = await addDoc(collRef, partialRef as unknown as Data);

		// Perform additional actions with the new document, do not await
		Promise.resolve(createdCallback?.(createdRef)).catch((err) => {
			// Log unhandled error
			useAppLogger("composables:useDocumentCreate:callback", err);
		});

		/** Get emulated data */
		const data = await $resolveClientRefs?.<Data, V>(
			{
				data: () => ({
					...(partialRef as unknown as Data),
					id: createdRef?.path,
				}),
				exists: true,
				ref: createdRef,
			},
			config
		);

		// Immediate data, hydration
		return [data || false];
	} catch (err) {
		if (!omitLoggings) {
			console.error("Error creating document", { createdRef, partialRef }, err);
			useAppLogger("composables:useDocumentCreate", err);
		}

		return [false];
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
	Data extends AuditData,
	Vgr extends InputFromData<Data> = InputFromData<Data>,
	V extends OutputFromData<Data> = OutputFromData<Data>,
>(
	nodeOrRef: V | DocumentReference<Data, V>,
	middleRef: Partial<Vgr> = {},
	{ omitLoggings, ...config }: iUseDocumentOptions = { omitLoggings: false, level: 0 }
): Promise<iNodeFnResponse<V>> {
	const SESSION = useSessionStore();
	const { $clientFirestore, $resolveClientRefs } = useNuxtApp();
	let node: V;
	let docRef: DocumentReference<Data, V>; // get node ref

	if (!nodeOrRef.id || !$clientFirestore) throw new Error("Document id is required");

	if (nodeOrRef instanceof DocumentReference) {
		node = <V>{ id: nodeOrRef.id };
		docRef = nodeOrRef;
	} else {
		node = nodeOrRef;
		docRef = <DocumentReference<Data, V>>doc($clientFirestore, nodeOrRef.id);
	}

	const partialRef = <Vgr>middleRef;

	// Conditionally inject member information
	if (SESSION.path) {
		const updatedByRef = doc($clientFirestore, SESSION.path);

		partialRef.updatedByRef = updatedByRef;
	}

	// Prevent overrides
	delete partialRef.createdAt;

	// Set timestamps
	partialRef.updatedAt = new Date();

	// Remove any undefined properties before writing to firestore
	removeUndefinedProperties(partialRef);

	try {
		// Allow updating nested properties
		// See: https://firebase.google.com/docs/firestore/manage-data/add-data#update_fields_in_nested_objects
		await updateDoc(docRef, partialRef as UpdateData<V>);

		/** Get emulated data */
		const data = await $resolveClientRefs?.<Data, V>(
			{
				data: () => {
					const newData = {
						...(node as unknown as Data),
						...(partialRef as unknown as Data),
						createdAt: node.createdAt,
						id: node.id || docRef?.path,
					};

					/**
					 * Relocates dot notation
					 * See: https://firebase.google.com/docs/firestore/manage-data/add-data#update_fields_in_nested_objects
					 */
					for (const k in newData) {
						if (!Object.hasOwn(newData, k) || !k.includes(".")) continue;

						// Assign value to right location
						set(newData, k, newData[k as keyof typeof newData]);
						// Remove dot notation property
						delete newData[k as keyof typeof newData];
					}

					return newData;
				},
				exists: true,
				ref: docRef,
			},
			config
		);

		// Immediate data, hydration
		return [data || false];
	} catch (err) {
		// Most likely a timeout
		if (!omitLoggings) {
			console.error("Error updating document", { docRef, partialRef }, err);
			useAppLogger("composables:useDocumentUpdate", err);
		}

		return [false];
	}
}

/** Clones given document */
export async function useDocumentClone<
	Data extends AuditData,
	Vgr extends InputFromData<Data> = InputFromData<Data>,
	V extends OutputFromData<Data> = OutputFromData<Data>,
>(
	node: V,
	middleRef: Partial<Vgr> = {},
	{ omitLoggings, ...config }: iUseDocumentOptions = { omitLoggings: false, level: 0 }
): Promise<iNodeFnResponse<V>> {
	const SESSION = useSessionStore();
	const INSTANCE = useInstanceStore();
	const { $clientFirestore, $resolveClientRefs } = useNuxtApp();

	if (!node.id || !$clientFirestore) throw new Error("Document id is required");

	// Instance is also required
	if (!INSTANCE) throw new Error("Missing instance");

	const docRef = <DocumentReference<Data, V>>doc($clientFirestore, node.id);
	const partialRef = <Vgr>middleRef;
	const source = (await getDoc(docRef)).data();

	if (!source) return [false];

	// Conditionally inject member information
	if (SESSION.token) {
		const memberId = getDocumentId(SESSION.path);
		const memberPath = `${INSTANCE.path}/members/${memberId}`;
		const clonedByRef = memberId ? doc($clientFirestore, memberPath) : undefined;

		partialRef.createdByRef = partialRef.updatedByRef = clonedByRef;
	}

	// Prevent overrides
	delete source.id;
	delete source.lock;

	// Set timestamps
	partialRef.createdAt = partialRef.updatedAt = new Date();

	const collRef = docRef.parent;
	let clonedDoc: DocumentReference<Data, V> | undefined;

	try {
		clonedDoc = await addDoc(collRef, { ...source, ...partialRef });

		/** Get emulated data */
		const data = await $resolveClientRefs?.<Data, V>(
			{
				data: () => ({
					...(partialRef as unknown as Data),
					id: clonedDoc?.path,
				}),
				exists: true,
				ref: clonedDoc,
			},
			config
		);

		// Immediate data, hydration
		return [data || false];
	} catch (err) {
		// Most likely a timeout
		if (!omitLoggings) {
			console.error("Error cloning document", { clonedDoc, partialRef }, err);
			useAppLogger("composables:useDocumentClone", err);
		}

		return [false];
	}
}

/** Deletes given document */
export async function useDocumentDelete<
	V extends OutputFromData<Data>,
	Data extends AuditData = AuditData,
>(
	node: V,
	{ omitLoggings }: iUseDocumentOptions = { omitLoggings: false, level: 0 }
): Promise<iNodeFnResponse<V>> {
	const SESSION = useSessionStore();
	const INSTANCE = useInstanceStore();
	const { $clientFirestore } = useNuxtApp();

	if (!node.id || !$clientFirestore) throw new Error("Document id is required");

	// Instance is also required
	if (!INSTANCE) throw new Error("Missing instance");

	const docRef = doc($clientFirestore, node.id);
	const memberId = getDocumentId(SESSION.path);
	const memberPath = `${INSTANCE.path}/members/${memberId}`;
	const deletedByRef = memberId ? doc($clientFirestore, memberPath) : undefined;

	// Prevent deletion if document is locked
	if (node.lock) return [false];

	try {
		// Set deletion author, cloud function will handle deletion
		await setDoc(docRef, { deletedByRef, updatedByRef: deletedByRef }, { merge: true });

		// Immediate data, hydration
		return [true]; // Assume deleted
	} catch (err) {
		// Most likely a timeout
		if (!omitLoggings) {
			console.error("Error deleting document", { docRef }, err);
			useAppLogger("composables:useDocumentDelete", err);
		}

		return [false];
	}
}
