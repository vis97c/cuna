import type { Timestamp as adminTimestamp } from "firebase-admin/firestore";
import type { Timestamp as clientTimestamp } from "firebase/firestore";

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

	/** Parse date */
	function getDate(date?: adminTimestamp | clientTimestamp | Date | string) {
		if (!date) return;
		if (date instanceof Date) return date;
		if (typeof date === "string") return new Date(date);
		if (typeof date === "object" && "toDate" in date) return date.toDate();

		console.error("Invalid date", date);
	}

	return {
		...config,
		// Parse Timestamp to Date
		siaMaintenanceTillAt: getDate(siaMaintenanceTillAt),
		explorerV1MaintenanceTillAt: getDate(explorerV1MaintenanceTillAt),
		explorerV2MaintenanceTillAt: getDate(explorerV2MaintenanceTillAt),
	};
}
