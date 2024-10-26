import type { EventHandler, EventHandlerRequest } from "h3";

/**
 * Conditionally cache event data.
 * Bypasses cahce for admin purposes
 *
 * @param handler event handler, should have its own error handling
 * @returns event handler
 */
export const defineConditionallyCachedEventHandler = <T extends EventHandlerRequest, D>(
	handler: EventHandler<T, D>
): EventHandler<T, D> => {
	/** Two minutes cache */
	const cachedData = defineCachedEventHandler(handler, { maxAge: 120 });

	return defineEventHandler<T>(async (event) => {
		const canModerate = getRequestHeader(event, "canModerate");

		if (canModerate) return handler(event);

		return cachedData(event);
	});
};
