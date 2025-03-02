import type { tLogger } from "@open-xamu-co/ui-common-types";

import type { LogData } from "../types/entities";

/**
 * Log to the db for later analysis
 */
export const getLog = (...args: Parameters<tLogger>) => {
	function isFirebaseError(error: unknown): error is { code: "string"; message: "string" } {
		return typeof error === "object" && !!error && "code" in error;
	}

	const [at, errorOrMessage, error] = args;
	const logData: Pick<LogData, "at" | "code" | "message" | "error"> = { at };
	const firebaseError = isFirebaseError(errorOrMessage);
	let originalError: any = undefined;

	if (!error) {
		if (firebaseError) {
			// TODO: Bypass some error codes from being logged
			logData.message = errorOrMessage.message;
			logData.code = errorOrMessage.code;
			logData.error = JSON.stringify(errorOrMessage);
			originalError = errorOrMessage;
		} else if (errorOrMessage instanceof Error) {
			logData.message = errorOrMessage.message;
			logData.error = errorOrMessage.toString();
			originalError = errorOrMessage;
		} else if (typeof errorOrMessage === "string") {
			logData.message = errorOrMessage;
		} else return; // Don't log
	} else if (typeof errorOrMessage === "string") {
		logData.message = errorOrMessage;
		logData.error = error.toString();
		originalError = error;
	} else return; // Don't log

	// Log to console
	if (firebaseError) console.debug(logData.code, logData.message, originalError);
	else if (originalError) console.error(logData.message, originalError);
	else console.log(logData.message);

	return logData;
};
