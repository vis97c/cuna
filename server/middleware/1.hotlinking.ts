import { isError, defineEventHandler, setResponseHeaders, setResponseStatus } from "h3";

import { apiLogger } from "../utils/firebase";

/**
 * Prevent hotlinking & clickjacking
 */
export default defineEventHandler(async (event) => {
	const headers = getRequestHeaders(event);
	/**
	 * Forwarded host is prefered
	 * Readable headers keys are lowercase
	 */
	const { host = "", "x-forwarded-host": forwardedHost = host } = headers;

	try {
		const { url } = await getInstance(event, forwardedHost);

		// Prevent further navigation if instance url is missing
		if (!url) return setResponseStatus(event, 500, "Missing instance url");

		const { hostname } = new URL(url);

		// Set Headers
		setResponseHeaders(event, {
			// Prevent cross-origin isolation
			"Cross-Origin-Embedder-Policy": "unsafe-none",
			// Prevent cross-origin isolation
			"Cross-Origin-Opener-Policy": "unsafe-none",
			// Prevent clickjacking
			"X-Frame-Options": "SAMEORIGIN",
			// Legacy XSS protection
			"X-XSS-Protection": "1; mode=block",
			// Prevent MIME type sniffing
			"X-Content-Type-Options": "nosniff",
			// Prevent referrer leaks
			"Referrer-Policy": "strict-origin-when-cross-origin",
			// CSP Defaults, safe assets only
			"Content-Security-Policy":
				"default-src 'self'; " +
				"media-src 'self' blob: data: https:; " +
				"frame-src 'self' data: https:;" +
				"img-src 'self' blob: data: https:; " +
				"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
				"style-src 'self' 'unsafe-inline' https:; " +
				"font-src 'self' data: https:; " +
				"connect-src 'self' https:; " +
				// Allow root (self) & subdomains
				`frame-ancestors 'self' https://*.${hostname};`,
		});
	} catch (err) {
		if (isError(err)) {
			apiLogger(event, "api:middleware:hotlinking", err.message, err);

			// Prevent further navigation
			return setResponseStatus(event, err.statusCode, err.message);
		}

		throw err;
	}
});
