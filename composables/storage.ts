import { collection, doc, DocumentReference, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes } from "firebase/storage";

/**
 * upload files, get urls
 */
export async function useFilesUpload(
	files: File[] = [],
	targetRef: DocumentReference,
	type = "images"
): Promise<string[]> {
	const SESSION = useSessionStore();

	if (!SESSION.canEdit) return [];

	const { $clientFirestore } = useNuxtApp();
	const storage = getStorage();
	// keep count
	const countersCollectionRef = collection($clientFirestore, "counters");
	const counterRef = doc(countersCollectionRef, `${targetRef.parent.id}_${type}`);
	const counterSnapshot = await getDoc(counterRef);
	const current: number = (counterSnapshot.data()?.current || 0) + 1;

	// increase counter in db
	await setDoc(counterRef, { current: current + files.length }, { merge: true });

	const paths = await Promise.all(
		files.map(async (file, fileIndex) => {
			const path = `${targetRef.path}_${current + fileIndex}`;
			const filePath = `${type}/${path}/original.${file.type.split("/")[1]}`;
			const imageRef = storageRef(storage, filePath);

			// upload file
			await uploadBytes(imageRef, file);

			return path;
		})
	);

	return paths;
}
