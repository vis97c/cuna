import type { DocumentReference } from "firebase-admin/firestore";
import type {
	EventHandler,
	EventHandlerRequest,
	EventHandlerResponse,
	H3Event,
	H3EventContext,
} from "h3";

import type { Instance, Member } from "~/utils/types";
import type { InstanceData } from "~~/functions/src/types/entities";

export interface H3Context extends H3EventContext {
	currentInstance?: Instance & { millis: number; url: string; id: string };
	currentInstanceRef?: DocumentReference<InstanceData>;
	/**
	 * Milliseconds from creation
	 */
	currentInstanceMillis?: number;
	/**
	 * Clean host without port
	 *
	 * @example "example.com"
	 * @cache used for instance cache key
	 */
	currentInstanceHost?: string;
	currentMember?: Member & { millis: number; id: string; uid: string };
	currentMemberRef?: DocumentReference;
	currentMemberMillis?: number;
}

export interface CachedH3Event<T extends EventHandlerRequest = EventHandlerRequest> extends Omit<
	H3Event<T>,
	"context"
> {
	context: H3Context;
}

export interface CachedEventHandler<
	T extends EventHandlerRequest = EventHandlerRequest,
	D extends EventHandlerResponse = EventHandlerResponse,
> extends Omit<EventHandler<T, D>, "event"> {
	(event: CachedH3Event<T>): D;
}
