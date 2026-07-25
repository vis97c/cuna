import {
	CollectionReference,
	DocumentReference,
	FieldValue,
	type Firestore,
} from "firebase-admin/firestore";
import acceptLanguageParser from "accept-language-parser";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import { getLog } from "./logs.ts";

export function makeScrapperLogger(
	at: DocumentReference | Firestore,
	authorRef?: DocumentReference,
	metadata: Record<string, any> = {}
): tLogger {
	return function (...args: Parameters<tLogger>) {
		// Clear malformed data
		if (metadata.context) {
			if (!metadata.context.authId) delete metadata.context.authId;
			if (!metadata.context.authType) delete metadata.context.authType;
		}
		if (metadata.change) delete metadata.change; // Non serializable

		const logData = getLog(...args, metadata);

		if (!logData) return;

		try {
			const logsRef = at.collection("logs");

			// Inject author
			if (at instanceof DocumentReference && authorRef) {
				logData.createdByRef = logData.updatedByRef = authorRef;
			}

			logsRef.add(logData);
		} catch (err) {
			console.error("Error logging to db", err, ...args);
		}
	};
}

/**
 * Log offending requests sources
 */
export function offenderLogger(
	at: DocumentReference | Firestore,
	lastLogRef: DocumentReference,
	metadata?: any
): void {
	if (!metadata || typeof metadata !== "object") return;

	// Headers keys are lowercase
	const headers: Record<Lowercase<string>, string> = metadata.headers || {};
	/**
	 * Get Request IP
	 * cf-connecting-ip is the most likely to be the client IP
	 * x-fah-client-ip Could point to proxy (Forwarded For)
	 * ip is not always present
	 */
	const ip = headers["cf-connecting-ip"] || headers["x-fah-client-ip"] || headers["ip"];
	const userAgent = headers["from"] || headers["user-agent"];
	const country = headers["cf-ipcountry"];
	const [preferredLanguage] = acceptLanguageParser.parse(headers["accept-language"]);

	if (!ip) return;

	const offendersRef: CollectionReference<Record<string, any>> = at.collection("offenders");
	const offenderDoc = offendersRef.doc(ip);
	const offenderData: Record<string, any> = { ip, hits: FieldValue.increment(1), lastLogRef };

	if (country) offenderData.countries = FieldValue.arrayUnion(country);
	if (userAgent) offenderData.userAgents = FieldValue.arrayUnion(userAgent);
	if (preferredLanguage) {
		const { code, region } = preferredLanguage;

		offenderData.languages = FieldValue.arrayUnion(`${code}-${region}`);
	}

	// Set or update offender, do not await
	offenderDoc.set(offenderData, { merge: true });
}
