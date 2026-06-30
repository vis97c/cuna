import { createHash } from "node:crypto";
import { FirebaseAuthError } from "firebase-admin/auth";
import {
	isError,
	getRequestHeaders,
	defineEventHandler,
	setResponseHeaders,
	setResponseStatus,
	setResponseHeader,
	getRequestHeader,
} from "h3";
import { useStorage } from "nitropack/runtime";

import { production } from "../utils/environment";
import { apiLogger, getServerFirebase } from "../utils/firebase";
import { getInstance } from "../utils/instance";
import { getMember } from "../utils/member";

/**
 * Inject current instance and auth into context
 */
export default defineEventHandler(async (event) => {
	const { firebaseFirestore } = getServerFirebase("api:middleware:context");
	const headers = getRequestHeaders(event);
	const corsHeaders = ["Origin", "Referer", "User-Agent"].join(", ");

	// Only provide context for firestore endpoints
	if (!event.path.startsWith("/api")) return;

	/**
	 * Forwarded host is prefered
	 * Readable headers keys are lowercase
	 */
	const {
		host = "",
		"x-forwarded-host": forwardedHost = host,
		"xamu-context-hits": contextHits = "0",
	} = headers;
	const [cleanHost] = forwardedHost.split(":");

	try {
		// Increment context hits
		setResponseHeader(event, "Xamu-Context-Hits", String(Number(contextHits) + 1));

		// Include port locally to avoid issues
		const { millis, ...instance } = await getInstance(event, forwardedHost);
		const instanceRef = firebaseFirestore.doc(instance.id);

		// Set instance context
		event.context.currentInstance = instance;
		event.context.currentInstanceRef = instanceRef;
		event.context.currentInstanceMillis = millis;
		event.context.currentInstanceHost = cleanHost;

		const origin =
			getRequestHeader(event, "X-Forwarded-Origin") ||
			getRequestHeader(event, "Origin") ||
			`https://${cleanHost}`;
		const { hostname } = new URL(origin);
		let corsOrigin = production.value() ? `https://${cleanHost}` : "*";

		// Set CORS origin for allowed domains
		if (instance.config?.domains?.includes(hostname)) corsOrigin = origin;

		const corsHeadersExpose = [corsHeaders, "Content-Type", "Cache-control"].join(", ");
		const corsHeadersAccept = [
			corsHeadersExpose,
			"Authorization",
			"Host",
			"Xamu-Context-Source",
		].join(", ");
		const Allow = "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS";

		// Set CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Origin": corsOrigin,
			Vary: "Host, Origin",
		});

		if (event.method?.toUpperCase() === "OPTIONS") {
			// Set CORS preflight headers
			setResponseHeaders(event, {
				"Access-Control-Allow-Headers": corsHeadersAccept,
				"Access-Control-Expose-Headers": corsHeadersExpose,
			});
		}

		/**
		 * Forwarded Authorization header is used when behind a proxy
		 * @see https://cloud.google.com/endpoints/docs/openapi/openapi-extensions#jwt_audience_disable_auth
		 * @see https://medium.com/google-cloud/gcp-api-gateway-for-cloud-run-authenticated-backend-with-firebase-auth-jwt-tokens-77ade3bc4f6d
		 */
		const authorization =
			getRequestHeader(event, "X-Forwarded-Authorization") ||
			getRequestHeader(event, "Authorization");

		if (!authorization) return;

		try {
			const memberData = await getMember(event, authorization);

			if (!memberData) return;

			const { millis, ...member } = memberData;

			// Set auth context
			event.context.currentMember = member;
			event.context.currentMemberRef = instanceRef.collection("members").doc(member.uid);
			event.context.currentMemberMillis = millis;
		} catch (err) {
			// Get auth error, clear cache
			const storage = useStorage("cache");
			const hash = createHash("sha256").update(authorization).digest("hex");

			// Remove auth cache
			await storage.removeItem(`nitro:functions:getMember:${hash}.json`);

			if (err instanceof FirebaseAuthError || isError(err)) {
				// Bypass expired token error
				if ("code" in err && err.code === "auth/id-token-expired") return;

				apiLogger(
					event,
					"api:middleware:context:member",
					`Path: "${event.path}", ${err.message}`,
					err
				);
			}
		}
	} catch (err) {
		// Get instance error, clear cache
		const storage = useStorage("cache");

		// Remove instance cache
		await storage.removeItem(`nitro:functions:getInstance:${cleanHost}.json`);

		// Bypass nuxt errors
		if (isError(err)) {
			apiLogger(
				event,
				"api:middleware:context",
				`Path: "${event.path}", ${err.message}`,
				err
			);

			// Prevent further navigation
			return setResponseStatus(event, err.statusCode, err.message);
		}

		throw err;
	}
});
