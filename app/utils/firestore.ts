import type { ExtendedInstanceDataConfig } from "~~/functions/src/types/entities";
import { isNotUndefString } from "./guards";

/**
 * Basic string to hash function
 *
 * @see https://stackoverflow.com/a/52171480
 */
export const Cyrb53 = (strs: string[] = [""], seed = 0) => {
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

export function safeInstanceConfig(
	config?: ExtendedInstanceDataConfig
): ExtendedInstanceDataConfig {
	const { siaMaintenanceTillAt, explorerV1MaintenanceTillAt, explorerV2MaintenanceTillAt } =
		config || {};

	return {
		...config,
		// Parse Timestamp to Date
		siaMaintenanceTillAt: (siaMaintenanceTillAt as any)?.toDate(),
		explorerV1MaintenanceTillAt: (explorerV1MaintenanceTillAt as any)?.toDate(),
		explorerV2MaintenanceTillAt: (explorerV2MaintenanceTillAt as any)?.toDate(),
	};
}
