import type { Timestamp as adminTimestamp } from "firebase-admin/firestore";
import type { Timestamp as clientTimestamp } from "firebase/firestore";

import type { InstanceDataConfig } from "~~/functions/src/types/entities/index.ts";

/**
 * Prevent exposing non serializable data
 */
export function safeInstanceConfig(config?: InstanceDataConfig): InstanceDataConfig {
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
