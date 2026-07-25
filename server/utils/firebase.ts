import type { H3Event } from "h3";
import { cert } from "firebase-admin/app";

import type { tLogger } from "@open-xamu-co/ui-common-types";

import { makeLogger } from "~/utils/logger";
import { getFirebase } from "~~/functions/src/utils/firebase";

import type { H3Context } from "../types";
import { clientEmail, privateKey, projectId } from "./environment";

export function getServerFirebase(at = "Unknown") {
	const credential = cert({
		projectId: projectId.value(),
		privateKey: privateKey.value(),
		clientEmail: clientEmail.value(),
	});

	return getFirebase(at, { credential });
}

export function apiLogger(event: H3Event, ...args: Parameters<tLogger>): void {
	const { currentMember, currentInstance } = <Partial<H3Context>>(event.context || {});
	const logger = makeLogger({ instancePath: currentInstance?.id, uid: currentMember?.uid });

	// use makeLogger to add additional context
	return logger(...args);
}
