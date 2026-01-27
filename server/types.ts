import type { DocumentReference } from "firebase-admin/firestore";

import type { CachedH3Event, H3Context } from "@open-xamu-co/firebase-nuxt/server";

import type { ExtendedInstance } from "~/utils/types";
import type { ExtendedInstanceData } from "~~/functions/src/types/entities";

export interface ExtendedH3Context extends H3Context {
	currentInstance?: ExtendedInstance & {
		millis: string;
		url: string;
		id: string;
	};
	currentInstanceRef?: DocumentReference<ExtendedInstanceData>;
}

export interface ExtendedH3Event extends CachedH3Event {
	context: ExtendedH3Context;
}
