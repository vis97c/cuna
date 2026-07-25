/**
 * AVOID NODE IMPORTS ON THIS FILE
 */

import type { tLogger } from "@open-xamu-co/ui-common-types";

import type { LogData } from "../types/entities/index.ts";

interface iFirebaseError {
	code: string;
	message: string;
}

function getFirebaseError(error: unknown): iFirebaseError | undefined {
	const isFirebaseError = typeof error === "object" && !!error && "code" in error;

	if (isFirebaseError) return error as iFirebaseError;
}

/**
 * Log to the db for later analysis
 * TODO: Bypass some firebase error codes from being logged
 */
export const getLog = (...args: Parameters<tLogger>) => {
	const [at, errorOrMessage, ...errorOrMetadata] = args;
	const logData: LogData = { at };
	let firebaseError: iFirebaseError | undefined;

	if (typeof errorOrMessage === "string") {
		// At, Message, Error, Metadata
		const [error, ...metadata] = errorOrMetadata;

		logData.message = errorOrMessage;
		logData.metadata = metadata;
		firebaseError = getFirebaseError(error);

		if (firebaseError) {
			logData.code = firebaseError.code;
			logData.error = JSON.stringify(firebaseError);
		} else if (error instanceof Error) {
			logData.error = error.toString();
		}
	} else {
		// At, Error, Metadata
		const [...metadata] = errorOrMetadata;

		logData.metadata = metadata;
		firebaseError = getFirebaseError(errorOrMessage);

		if (firebaseError) {
			logData.message = firebaseError.message;
			logData.code = firebaseError.code;
			logData.error = JSON.stringify(firebaseError);
		} else if (errorOrMessage instanceof Error) {
			logData.message = errorOrMessage.message;
			logData.error = errorOrMessage.toString();
		}
	}

	// Flatten metadata if possible
	if (Array.isArray(logData.metadata)) {
		if (logData.metadata.length <= 1) logData.metadata = logData.metadata[0] || "";
		else {
			const metadata: Record<string, any> = {};

			for (let i = 0; i < logData.metadata.length; i++) {
				const item = logData.metadata[i];

				if (typeof item === "object") Object.assign(metadata, item);
				else metadata[`metadata${i}`] = item;
			}

			logData.metadata = metadata;
		}
	}

	console.warn(logData.message);

	return logData;
};
