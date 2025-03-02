const maxAge = 60 * 60 * 24 * 30; // seconds in a month

/**
 * Rdr to firebase media
 */
const cachedBuffer = defineCachedEventHandler(
	async (event) => {
		const { firebaseConfig } = useRuntimeConfig().public;
		const { serverStorage } = getServerFirebase();
		const path = getRouterParam(event, "path");

		debugFirebaseServer(event, "api:media", path);

		if (!path) throw createError({ statusCode: 400, statusMessage: `Missing file path` });

		const [basePath] = path.split("."); // file extension not required
		const bucket = serverStorage.bucket(firebaseConfig.storageBucket);
		const file = bucket.file(`${basePath}.webp`);
		const [exists] = await file.exists();

		if (!exists) {
			throw createError({
				statusCode: 404,
				statusMessage: `File with path: "${path}" does not exist`,
			});
		}

		const [buffer] = await file.download();

		return { path, buffer };
	},
	{ maxAge }
);

/**
 * Media endpoint
 *
 * @see https://github.com/unjs/nitro/issues/1894
 */
export default defineEventHandler(async (event) => {
	try {
		const { buffer } = await cachedBuffer(event);

		if (!buffer) return sendRedirect(event, "/images/sample.png", 302);

		setHeaders(event, { "Content-Type": "image/webp" });

		return Buffer.from(buffer);
	} catch (err) {
		if (isError(err)) serverLogger("api:media:[...path]", err.message, err);

		throw err;
	}
});
