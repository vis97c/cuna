import { getFirestore, collection, addDoc, Firestore, doc } from "firebase/firestore";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import type { LogData } from "~~/functions/src/types/entities";
import { getLog } from "~~/functions/src/utils/logs";

import { getDocumentId } from "./resolver";
import type { LogRef } from "./types/entities/log";

interface iMakeLogger {
	instanceId?: string;
	uid?: string;
	loggerFirestore?: Firestore;
}

/**
 * Logger
 * No circular dependencies or nuxt context
 * Conditionally log user data
 */
export function makeLogger({ instanceId, uid, loggerFirestore }: iMakeLogger = {}): tLogger {
	return async function (...args) {
		try {
			// Ids only
			instanceId = getDocumentId(instanceId);
			uid = getDocumentId(uid);

			const instancePath = `instances/${instanceId}`;
			const memberPath = `${instancePath}/members/${uid}`;
			let logData: LogRef | LogData;

			if (import.meta.server) {
				try {
					const { useEvent } = await import("nitropack/runtime");
					const { getRequestHeaders } = await import("h3");
					// Set server metadata
					const event = useEvent();
					const { url, statusCode, statusMessage, method } = event.node.req;
					/**
					 * Forwarded host is prefered
					 * Readable headers keys are lowercase
					 */
					const {
						host,
						"x-forwarded-host": forwardedHost = host,
						"xamu-context-hits": contextHits = "0",
						"xamu-context-source": contextSource = "unknown", // Server or client
						...headers
					} = getRequestHeaders(event);

					// Inject request data for additional context
					logData = getLog(...args, {
						headers,
						url,
						statusCode,
						statusMessage,
						method,
						forwardedHost,
						contextHits: Number(contextHits),
						contextSource,
					});
				} catch (error) {
					logData = getLog(...args, { errorMessage: "Could not get server metadata" });
				}

				// Prevent server (firebase) imports from being injected into the client
				const { getServerFirebase } = await import("../../server/utils/firebase");
				const { firebaseFirestore } = getServerFirebase("makeLogger");
				const at = instanceId ? firebaseFirestore.doc(instancePath) : firebaseFirestore;

				// Inject author
				if (instanceId && uid) {
					const createdByRef = firebaseFirestore.doc(memberPath);

					logData.createdByRef = logData.updatedByRef = createdByRef;
				}

				// Log on server side
				await at.collection("logs").add(logData);
			} else {
				// Inject user agent for additional context
				logData = getLog(...args, { userAgent: navigator.userAgent });

				// Get client firebase app
				loggerFirestore ||= getFirestore();

				const logsRef = collection(
					loggerFirestore,
					instanceId ? `${instancePath}/logs` : "logs"
				);

				// Inject author
				if (instanceId && uid) {
					const createdByRef = doc(loggerFirestore, memberPath);

					// Admin SDK DocumentReference is not assignable to client SDK DocumentReference
					logData.createdByRef = logData.updatedByRef = createdByRef as any;
				}

				// Log on client side
				await addDoc(logsRef, logData);
			}
		} catch (err) {
			console.error("Error logging to db", err);
		}
	};
}
