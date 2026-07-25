import { createHash } from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { defineEventHandler, getRouterParam, HTTPError, noContent } from "h3";
import { defineCachedFunction } from "nitro/cache";

import type { CachedH3Event } from "~~/server/types.ts";
import { storageBucket } from "../../utils/environment.ts";
import { debugFirebaseServer } from "../../utils/firestore.ts";
import { apiLogger } from "../../utils/firebase.ts";
import { eMemberRole } from "~~/functions/src/types/entities/index.ts";

const maxAge = 60 * 60 * 24; // seconds in a day
const preventCache = {
	Pragma: "no-cache",
	Expires: "Tue, 03 Jul 2001 06:00:00 GMT",
	"Last-Modified": new Date().toUTCString(),
	"Cache-Control": "max-age=0, no-cache, must-revalidate, proxy-revalidate",
};

interface FileHandlerResponse {
	buffer?: Buffer;
	headers?: Record<string, string>;
	error?: Error;
}

async function fileHandler(event: CachedH3Event, path: string): Promise<FileHandlerResponse> {
	debugFirebaseServer(event, "api:media", path);

	if (!path) {
		return { error: new HTTPError("Invalid file path", { status: 400 }) };
	}

	// Setup bucket
	const serverStorage = getStorage();
	const bucket = serverStorage.bucket(storageBucket.value());

	// Get file with path
	const [baseAndExtension] = path.split("?"); // Ignore query params
	const [, extension] = baseAndExtension.split(".");
	const file = bucket.file(baseAndExtension);

	// Fetch supported extensions
	switch (extension) {
		case "webp": {
			const [exists] = await file.exists();
			const headers: Record<string, string> = { "Content-Type": "image/webp" };

			// Return actual file
			if (exists) {
				// Bypass body for HEAD requests
				if (event.req.method.toUpperCase() === "HEAD") return { headers };

				const [buffer] = await file.download();

				return { buffer, headers };
			}

			// File not found, as image, check if it is being resized
			const parts = baseAndExtension.split("/");

			// Remove file name
			parts.pop();

			const [files] = await bucket.getFiles({ prefix: parts.join("/") });

			// If files within directory (original, resized...), return a 503 with a retry-after header
			// @see https://stackoverflow.com/questions/9794696/which-http-status-code-means-not-ready-yet-try-again-later
			if (files.length) {
				return {
					headers: { ...preventCache, "Retry-After": "120" },
					error: new HTTPError(`File with path: "${path}" is not ready yet`, {
						status: 503,
					}),
				};
			}

			break;
		}
	}

	return {
		headers: preventCache,
		error: new HTTPError(`File with path: "${path}" does not exist`, { status: 404 }),
	};
}

/**
 * Media endpoint
 *
 * Buffer check because of nitro issue:
 * @see https://github.com/unjs/nitro/issues/1894
 */
export default defineEventHandler(async (event: CachedH3Event) => {
	const { currentMember } = event.context;
	const path = getRouterParam(event, "path") || "";
	const Allow = "GET,HEAD";
	/**
	 * Rdr to firebase media.
	 * Errors are not cached.
	 *
	 * @example /api/media/images/instances/abc123/variants/def456/ghi789.webp
	 */
	const cachedBufferHandler = defineCachedFunction(fileHandler, {
		name: "getMedia",
		maxAge,
		getKey(event, path) {
			// Compact hash
			const hash = createHash("sha256").update(path).digest("hex");

			return `${hash}:${event.method}`;
		},
	});

	try {
		// Override CORS headers
		event.res.headers.set("Allow", Allow);
		event.res.headers.set("Access-Control-Allow-Methods", Allow);

		// Only GET, HEAD & OPTIONS are allowed
		if (!["GET", "HEAD", "OPTIONS"].includes(event.req.method.toUpperCase())) {
			throw new HTTPError("Unsupported method", { status: 405 });
		} else if (event.req.method.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return noContent();
		}

		let response: FileHandlerResponse;

		// Bypass cache for admin purposes
		if (currentMember?.role !== undefined && currentMember.role <= eMemberRole.MODERATOR) {
			/* Prevent cache
			 * @see https://stackoverflow.com/a/9886945/3304008
			 */
			event.res.headers.set("Expires", "Tue, 03 Jul 2001 06:00:00 GMT");
			event.res.headers.set("Last-Modified", new Date().toUTCString());
			event.res.headers.set(
				"Cache-Control",
				"max-age=0, no-cache, must-revalidate, proxy-revalidate"
			);

			response = await fileHandler(event, path);
		} else {
			response = await cachedBufferHandler(event, path);
		}

		const { buffer, headers = {}, error } = response;

		// Set headers
		Object.entries(headers).forEach(([key, value]) => {
			event.res.headers.set(key, value);
		});

		if (error || !buffer) {
			// Bypass body for HEAD requests
			if (!error && event.req.method.toUpperCase() === "HEAD") {
				event.res.status = 200;

				// Prevent no content status
				return "Ok";
			}

			// Set fallback error
			const err =
				error ||
				new HTTPError(
					`Something went wrong while trying to get file with path: "${path}"`,
					{ status: 500 }
				);

			throw err;
		}

		return Buffer.from(buffer);
	} catch (err) {
		const storage = useStorage("cache");
		const hash = createHash("sha256").update(path).digest("hex");

		// Remove media cache
		await storage.removeItem(`nitro:functions:getMedia:${hash}.json`);

		// Bypass nuxt errors
		if (err instanceof HTTPError) {
			// Do not log if file isn't ready
			if (err.status !== 503) apiLogger(event, "api:media:[...path]", err.message, err);

			throw err;
		}

		throw err;
	}
});
