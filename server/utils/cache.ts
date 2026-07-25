import type {
	EventHandler,
	EventHandlerRequest,
	EventHandlerResponse,
	EventHandlerWithFetch,
} from "h3";
import { defineCachedHandler } from "nitro/cache";
import { defineHandler } from "nitro";

import type { CachedEventHandler, CachedH3Event } from "../types.ts";
import { eMemberRole } from "~~/functions/src/types/entities/index.ts";

interface CachedEventHandlerOptions<T extends EventHandlerRequest = EventHandlerRequest> {
	/** Optional key generator */
	getKey?: (...args: [CachedH3Event<T>]) => string | Promise<string>;
	/** Partition cache by instance */
	instanceOnly?: boolean;
	/** Partition cache by method */
	methodOnly?: boolean;
}

/**
 * Conditionally cache event data.
 * Bypasses cache for admin purposes
 * Caches by instance by default
 *
 * @cache 30 seconds
 *
 * @param handler event handler, should have its own error handling
 * @param options optional key generator and instanceOnly flag
 * @returns event handler
 */
export const defineConditionallyCachedEventHandler = <
	T extends EventHandlerRequest,
	D extends EventHandlerResponse = EventHandlerResponse,
>(
	handler: EventHandler<T, D>,
	{ getKey, instanceOnly = true, methodOnly = true }: CachedEventHandlerOptions<T> = {}
): EventHandlerWithFetch<T, D> => {
	const cachedHandler = defineCachedHandler(handler, {
		maxAge: 30, // 30 seconds
		getKey(event: CachedH3Event<T>) {
			// Prefix with instance host if available
			const { currentInstanceHost } = event.context;
			let key = getKey?.(event) || event.path;

			if (instanceOnly && currentInstanceHost) key += `:${currentInstanceHost}`;
			if (methodOnly) key += `:${event.method}`;

			return key;
		},
	});

	return defineHandler<T>((event: CachedH3Event<T>) => {
		const { currentMember } = event.context;

		// Bypass cache for admin purposes
		if (currentMember?.role !== undefined && currentMember.role <= eMemberRole.MODERATOR) {
			/* Prevent cache
			 * @see https://stackoverflow.com/a/9886945/3304008
			 */
			setResponseHeaders(event, {
				Expires: "Tue, 03 Jul 2001 06:00:00 GMT",
				"Last-Modified": new Date().toUTCString(),
				"Cache-Control": "max-age=0, no-cache, must-revalidate, proxy-revalidate",
			});

			return handler(event);
		}

		setResponseHeaders(event, { "Cache-Control": "max-age=30, must-revalidate" });

		return cachedHandler(event);
	});
};
