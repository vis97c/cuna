import { apiStorage } from "~/server/utils/firebase";

const maxAge = 60 * 60 * 24 * 30; // seconds in a month

/**
 * Rdr to firebase media
 */
const cachedBuffer = defineCachedEventHandler(
	async (event) => {
		const { firebaseConfig } = useRuntimeConfig().public;
		const path = getRouterParam(event, "path");

		debugFirebaseServer(event, "api:media", path);

		if (!path) {
			console.log("Invalid path given");

			return;
		}

		try {
			const [basePath] = path.split("."); // file extension not required
			const bucket = apiStorage.bucket(firebaseConfig.storageBucket);
			const file = bucket.file(`${basePath}.webp`);
			const [exists] = await file.exists();

			if (!exists) {
				console.log(`File with path: "${path}" does not exist`);

				return;
			}

			const [buffer] = await file.download();

			return buffer;
		} catch (err) {
			console.log(err);

			return;
		}
	},
	{ maxAge }
);

/**
 * Media endpoint
 *
 * @see https://github.com/unjs/nitro/issues/1894
 */
export default defineEventHandler(async (event) => {
	const buffer = await cachedBuffer(event);

	if (!buffer) return sendRedirect(event, "/images/sample.png", 302);

	setHeaders(event, { "Content-Type": "image/webp" });

	return Buffer.from(buffer);
});
