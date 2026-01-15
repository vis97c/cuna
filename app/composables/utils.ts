import { isEqual } from "lodash-es";

import type { Group } from "~/utils/types";

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
