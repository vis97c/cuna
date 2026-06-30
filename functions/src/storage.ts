import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

import { getFirebase } from "./utils/firebase.js";
import { makeFunctionsLogger } from "./utils/logger.js";

/**
 * Resize buffer
 *
 * Preserve orientation
 * @see https://stackoverflow.com/questions/48716266/sharp-image-library-rotates-image-when-resizing
 */
function resizeBuffer(
	buffer: Buffer,
	{ webp, resize }: { webp?: sharp.WebpOptions; resize: sharp.ResizeOptions }
): Promise<Buffer> {
	return sharp(buffer)
		.rotate() // Preserve orientation
		.resize({ width: 75, height: 75, withoutEnlargement: true, ...resize })
		.webp({ lossless: true, ...webp })
		.toBuffer();
}

/**
 * Resize images & remove original
 *
 * @docType storage
 * @event upload
 */
export const resizeImages = onObjectFinalized(
	{ region: "us-east1", memory: "1GiB", concurrency: 1, maxInstances: 10, timeoutSeconds: 120 },
	async ({ data, ...loggerMetadata }) => {
		const { bucket: bucketName, metadata: { memberPath } = {} } = data;
		const { firebaseFirestore } = getFirebase("functions:storage:resizeImages");
		const memberRef = memberPath ? firebaseFirestore.doc(memberPath) : undefined;
		/**
		 * Prefer parent instance for logging
		 *
		 * @path instances/{instanceId}/members/{memberId}
		 */
		const at = memberRef?.parent.parent || firebaseFirestore;
		const logger = makeFunctionsLogger(at, memberRef, loggerMetadata);
		// Get file info
		const originalPath = data.name;
		const contentType = data.contentType;
		const splitPath = originalPath.split("/");
		const [type] = splitPath;
		const [ogFilename] = (splitPath.pop() || "").split(".");

		// Only images, prevent resized images from being reprocessed
		if (!contentType?.startsWith("image/") || type !== "images" || ogFilename !== "original") {
			return;
		}

		const basePath = splitPath.join("/");
		const bucket = getStorage().bucket(bucketName);
		const metadata = { contentType }; // File metadata

		try {
			const [imageBuffer] = await bucket.file(originalPath).download();

			// Outputs
			const [bufferAvatar, bufferSmall, bufferMedium, bufferLarge] = await Promise.all([
				resizeBuffer(imageBuffer, { resize: { withoutEnlargement: false } }), // Cropped avatar
				resizeBuffer(imageBuffer, { resize: { width: 300, height: 300, fit: "inside" } }), // Resized small
				resizeBuffer(imageBuffer, { resize: { width: 600, height: 600, fit: "inside" } }), // Resized medium
				resizeBuffer(imageBuffer, { resize: { width: 1200, height: 1200, fit: "inside" } }), // Resized large
			]);

			// Save resized images
			// Webp is optimal and supports animation
			await Promise.all([
				bucket.file(`${basePath}/avatar.webp`).save(bufferAvatar, { metadata }),
				bucket.file(`${basePath}/small.webp`).save(bufferSmall, { metadata }),
				bucket.file(`${basePath}/medium.webp`).save(bufferMedium, { metadata }),
				bucket.file(`${basePath}/large.webp`).save(bufferLarge, { metadata }),
			]);
		} catch (err) {
			logger("functions:storage:resizeImages", err);

			throw err;
		}

		// Remove original at last, no matter what, do not await
		return bucket.file(originalPath).delete();
	}
);
