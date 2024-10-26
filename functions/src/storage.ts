import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

function resizeBuffer(
	buffer: Buffer,
	{ webp, resize }: { webp?: sharp.WebpOptions; resize: sharp.ResizeOptions }
): Promise<Buffer> {
	return sharp(buffer)
		.webp({ lossless: true, ...webp })
		.resize({ width: 75, height: 75, withoutEnlargement: true, ...resize })
		.toBuffer();
}

/**
 * Resize images & remove original
 *
 * @docType storage
 * @event upload
 */
export const resizeImages = onObjectFinalized(
	{ region: "us-east1" },
	async ({ data, bucket: bucketName }) => {
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
		const metadata = { contentType };
		const [imageBuffer] = await bucket.file(originalPath).download();

		// Outputs
		const [bufferAvatar, bufferSmall, bufferMedium, bufferLarge] = await Promise.all([
			resizeBuffer(imageBuffer, { resize: { withoutEnlargement: false } }),
			resizeBuffer(imageBuffer, { resize: { width: 300, height: 300, fit: "inside" } }),
			resizeBuffer(imageBuffer, { resize: { width: 600, height: 600, fit: "inside" } }),
			resizeBuffer(imageBuffer, { resize: { width: 1200, height: 1200, fit: "inside" } }),
		]);

		return Promise.all([
			bucket.file(`${basePath}/avatar.webp`).save(bufferAvatar, { metadata }),
			bucket.file(`${basePath}/small.webp`).save(bufferSmall, { metadata }),
			bucket.file(`${basePath}/medium.webp`).save(bufferMedium, { metadata }),
			bucket.file(`${basePath}/large.webp`).save(bufferLarge, { metadata }),
			bucket.file(originalPath).delete(), // remove original file
		]);
	}
);
