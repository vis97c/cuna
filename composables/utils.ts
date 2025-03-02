import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import { isEqual } from "lodash-es";

import type { Group, LogRef } from "~/resources/types/entities";
import { isNotUndefString } from "~/resources/utils/guards";
import type { tLogger } from "@open-xamu-co/ui-common-types";
import { getLog } from "~/functions/src/utils/logs";

export function useImagePath(
	path?: string,
	preset: "avatar" | "small" | "medium" | "large" = "avatar"
) {
	if (!path) return "/images/sample.png";

	return `/api/media/images/${path}/${preset}.webp`;
}

export function valuesAreEqual<V extends Record<string, any>>(
	values: V,
	expectedValues: Partial<V>
): boolean {
	const keys = Object.keys(expectedValues) as Array<keyof V>;

	return keys.filter((k) => k in values).every((k) => isEqual(values[k], expectedValues[k]));
}

/**
 * Basic string to hash function
 *
 * @see https://stackoverflow.com/a/52171480
 */
export const useCyrb53 = (strs: (string | undefined)[] = [""], seed = 0) => {
	const str = strs.filter(isNotUndefString).join("");
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;

	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Count spots
 * Conditionally omit non-regular enrollment spots
 *
 * Asummes groups are filtered out
 */
export function useCountSpots(groups: Group[] = []): number {
	return groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);
}

export function useTGroup(count = 0) {
	const t = count === 1 ? "grupo" : "grupos";

	return `${count} ${t}`;
}

export function useTSpot(count = 0) {
	const t = count === 1 ? "cupo" : "cupos";

	return `${count} ${t}`;
}

export function useTCredits(count = 0) {
	const t = count === 1 ? "crédito" : "créditos";

	return `${count} ${t}`;
}

export function useMinMilis(minutes: number) {
	return minutes * 60 * 1000;
}

export function useFetchQuery<R>(
	url: string,
	{
		options,
		...query
	}: Record<string, any> & { options?: Omit<NitroFetchOptions<NitroFetchRequest>, "query"> } = {}
) {
	const SESSION = useSessionStore();

	return $fetch<R>(url, {
		cache: "no-cache",
		credentials: "same-origin",
		...options,
		query,
		headers: { authorization: SESSION.token || "", ...options?.headers },
	});
}

export const useLogger: tLogger = async (...args): Promise<void> => {
	const logData = getLog(...args);

	if (!logData) return;

	try {
		useDocumentCreate<LogRef>("logs", logData);
	} catch (err) {
		console.error("Error logging to db", err);
	}
};
