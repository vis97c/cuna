import { toRaw } from "vue";
import { collection, doc, DocumentReference, getDoc, increment, setDoc } from "firebase/firestore";
import { getToken } from "firebase/app-check";

import { useNuxtApp, useRuntimeConfig } from "#imports";

interface UploadOptions {
	type?: "images" | "videos";
	customMetadata?: Record<string, any>;
	/**
	 * File paths callback
	 *
	 * Runs if not all files were uploaded
	 */
	paths?: (tentativePaths: string[]) => any;
	/**
	 * Runs if all files were uploaded
	 */
	success?: (uploadedPaths: string[]) => void;
}

/**
 * Upload files to Firebase Storage, get paths
 *
 * Files should not bother with instances
 */
export default async function useFirebaseStorageUpload(
	files: File[] = [],
	targetRef: DocumentReference, // Document related to the files
	options: UploadOptions = {}
): Promise<string[]> {
	const APP = useAppStore();
	const SESSION = useSessionStore();
	const INSTANCE = useInstanceStore();
	const { $clientFirestore, $clientAppCheck } = useNuxtApp();
	const { firebaseConfig } = useRuntimeConfig().public;
	const appData = toRaw(firebaseConfig);
	// Upload options
	const { type = "images", customMetadata = {}, paths: pathsCallback, success } = options;

	if (!$clientFirestore || !$clientAppCheck) throw new Error("Upload not authorized");
	else if (!["images", "videos"].includes(type)) throw new Error("Unsupported file type");

	// Save author
	const memberId = getDocumentId(SESSION.path);
	const memberPath = `${INSTANCE.path}/members/${memberId}`;
	const updatedByRef = memberId ? doc($clientFirestore, memberPath) : undefined;
	// Keep count
	const parentCollection = targetRef.parent;
	const grandParentDocument = parentCollection.parent;
	const counterPath = grandParentDocument?.path || INSTANCE.path; // Prefer subcollection
	const countersCollectionRef = collection($clientFirestore, `${counterPath}/counters`);
	// Document associated file counter
	const counterId = `${type}_${parentCollection.id}_${targetRef.id}`;
	const counterRef = doc(countersCollectionRef, counterId);
	const counterSnapshot = await getDoc(counterRef);
	const { current = 0, createdByRef = updatedByRef } = counterSnapshot.data() || {};
	// Get custom auth token for the worker
	const authToken: string = await customCsrfFetch("/api/instance/auth", { method: "POST" });
	// App check token
	const { token: appCheckToken } = await getToken($clientAppCheck);

	try {
		// Increase counter in db, do not await
		setDoc(
			counterRef,
			{ current: increment(files.length), createdByRef, updatedByRef },
			{ merge: true }
		);
	} catch (err) {
		// Log counter update error
		useAppLogger("composables:files:useFirebaseStorageUpload:counter", counterRef.path, err);
	}

	// Upload tracking
	const paths: string[] = [];

	// Upload files do not await
	Promise.all(
		files.map(async (file, index) => {
			const path = `${targetRef.path}_${current + index + 1}`;
			const filePath = `${type}/${path}/original.${file.type.split("/")[1]}`;
			const id = `${targetRef.id}_${file.name}`;

			if (!file.size) {
				// Invalid file
				useAppLogger(
					"composables:files:useFirebaseStorageUpload:map",
					new Error("Invalid file"),
					{
						path,
						size: file.size,
						type: file.type,
						name: file.name,
						lastModified: file.lastModified,
					}
				);

				throw new Error("Invalid file");
			}

			paths.push(path);
			// Save thumbnail as fallback for upload, do not await
			APP.saveThumbnail(path, file);

			// Upload file, set queue for the user, do not await
			return APP.useQueue(
				id,
				`Subiendo ${type === "images" ? "imágenes" : "videos"}`,
				async () => {
					try {
						const worker = new Worker("/js/firestorage-upload.js", {
							type: "module",
						});

						const uploadedSize = await new Promise<number>((resolve, reject) => {
							// Start background file upload
							worker.postMessage({
								filePath,
								file,
								customMetadata: { filePath, memberPath, ...customMetadata },
								appData,
								appCheckToken,
								authToken,
							});
							// Get result
							worker.onmessage = ({ data }) => {
								const { result, error, message, type } = data;

								switch (type) {
									case "result":
										resolve(result);
										break;
									case "message":
										console.log(message);
										break;
									case "error":
										// Crash if upload error
										console.log(message, error);
										reject(error);
										break;
								}
							};
							// Handle worker errors
							worker.onerror = (err) => reject(err);
							worker.onmessageerror = (err) => reject(err);
						});

						// Expected file size
						if (!uploadedSize) throw `No se subió el archivo ${id}`;

						// Wait for processing (image resizing), 10 seconds
						await new Promise((resolve) => setTimeout(resolve, 1000 * 10));

						return {
							data: path,
							message: `Archivo subido (${(uploadedSize / 1000000).toFixed(2)}MB)`,
						};
					} catch (err) {
						// Couldn't upload file
						paths.splice(paths.indexOf(path), 1); // Mutate paths
						pathsCallback?.(paths); // Update db callback
						useAppLogger(
							"composables:files:useFirebaseStorageUpload:upload",
							path,
							err
						);

						throw `No se subió el archivo ${id}`;
					}
				},
				10 // Minutes per upload
			);
		})
	).then((results) => {
		const uploadedPaths = results.reduce((acc: string[], { data = "" }) => {
			if (data) acc.push(data);

			return acc;
		}, []);

		// Call success callback if all files were uploaded
		if (uploadedPaths.length === files.length) success?.(uploadedPaths);
	});

	// Return tentative paths
	return paths;
}
