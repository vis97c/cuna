import { type DocumentReference, setDoc } from "firebase/firestore";

import type { NoteRef } from "~/utils/types";
import useFirebaseStorageUpload from "./useFirebaseStorageUpload";

export async function uploadNoteImage(
	ref: DocumentReference<NoteRef>,
	file: File,
	refresh?: (...args: any[]) => any
) {
	async function uploaded([image = ""]: string[]) {
		await setDoc(ref, { image }, { merge: true });

		if (refresh) setTimeout(refresh, 1000 * 10); // Refresh after 10 seconds
	}

	try {
		// Upload files
		const images = await useFirebaseStorageUpload([file], ref, { paths: uploaded });

		return uploaded(images);
	} catch (err) {
		useAppLogger("composables:files:uploadNoteImage", "Error al subir archivo", err);
	}
}
