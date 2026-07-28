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

		/** Check is value is expected */
		const expected = ![null, undefined, ""].includes(expectedValues[k]);
		/** Check if value was provided */
		const provided = values[k] || values[k] === 0;

		// If provided or expected
		if (k in values || (expected && !provided)) {
			const equal = isEqual(values[k], expectedValues[k]);
			const emptyArray = isEqual(values[k] || [], expectedValues[k]);

			if (equal || emptyArray) continue;

			keysWithDifference.push(k);
			differentValues[k] = <V[keyof V]>(values[k] ?? "");
		}
	}

	if (!keysWithDifference.length) return;

	return differentValues;
}

export function useCreateError(message: string, statusCode = 500) {
	return createError({ message, statusCode, fatal: true });
}

/**
 * Append tracking information to external urls
 */
export function useUTMLink(link: string) {
	const INSTANCE = useInstanceStore();
	const { hostname } = new URL(INSTANCE.current?.url || "");
	const url = new URL(link);

	url.searchParams.append("utm_source", hostname);
	url.searchParams.append("utm_content", "textlink");

	return url.toString();
}

/**
 * Attemp to reload image after a few seconds
 */
export function onImageError(event: Event) {
	const APP = useAppStore();
	const img = event.target as HTMLImageElement;
	const [src] = img.src.split("?");

	// Match firebase images
	if (src.includes("/api/media/images/instances/")) {
		const key = src.slice(18, src.lastIndexOf("/"));
		const thumbnail = APP.thumbnails[key];

		// Prefer thumbnail if any
		if (thumbnail) {
			// Remove loaded thumbnail from memory once loaded
			img.onload = () => URL.revokeObjectURL(thumbnail);

			return (img.src = thumbnail);
		}
	}

	for (let attemp = 0; attemp < 10; attemp++) {
		try {
			setTimeout(async () => {
				// Check if file exists
				const now = Date.now();
				const unchached = `${src}?t=${now}`;
				const response = await fetch(src);

				if (!response.ok) {
					// 503, attempt again
					if (response.status === 503) return;

					throw new Error("Image not found");
				}

				img.src = unchached;
			}, 1000 * 5); // 5 seconds
		} catch (err) {
			// Unknown error, stop trying
			break;
		}
	}
}

/**
 * Logging for debugging purposes on client
 */
export function debugFirebaseClient(mss: string, ...args: any[]) {
	const { debugFirebase } = useRuntimeConfig().public;

	if (debugFirebase && import.meta.client) console.debug(`Client: ${mss},`, ...args);
}
