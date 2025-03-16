import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import { isEqual } from "lodash-es";

import type { Group, LogRef } from "~/resources/types/entities";
import type { tLogger } from "@open-xamu-co/ui-common-types";
import { getLog } from "~/functions/src/utils/logs";

export function valuesAreEqual<V extends Record<string, any>>(
	values: V,
	expectedValues: Partial<V>
): boolean {
	const keys = Object.keys(expectedValues) as Array<keyof V>;

	return keys.filter((k) => k in values).every((k) => isEqual(values[k], expectedValues[k]));
}

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

/**
 * Return object with differing properties if any
 */
export function getValuesDiff<V extends Record<string, any>>(
	values: V,
	expectedValues: Partial<V>
) {
	const keysWithDifference: Array<keyof V> = [];
	const differentValues: Partial<V> = {};

	for (const k in expectedValues) {
		if (!Object.hasOwn(expectedValues, k)) continue;

		const expected = ![null, undefined, ""].includes(expectedValues[k]);
		const provided = values[k] || values[k] === 0;

		// If provided or expected
		if (k in values || (expected && !provided)) {
			const equal = isEqual(values[k], expectedValues[k]);

			if (equal) continue;

			keysWithDifference.push(k);
			differentValues[k] = <V[keyof V]>(values[k] ?? "");
		}
	}

	if (!keysWithDifference.length) return;

	return differentValues;
}
