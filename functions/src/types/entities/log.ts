import type { DocumentReference } from "firebase-admin/firestore";

import type { AuditData } from "./member.ts";

/**
 * General log entity
 *
 * @id auto-generated
 * @collection logs
 */
export interface LogData extends AuditData {
	at?: string;
	code?: string;
	message?: string;
	error?: string;
	/** Additional log tracking metadata */
	metadata?: any;
	/**
	 * Internal logs, omit some automation
	 * @automated
	 */
	internal?: boolean;
}

/**
 * Offender entity
 *
 * Keep track of abbussive requests
 *
 * @id ip address
 * @collection offenders
 */
export interface OffenderData extends AuditData {
	/** IP address */
	ip?: string;
	/** ISO country codes */
	countries?: string[];
	/** User agents */
	userAgents?: string[];
	/** Preferred languages */
	languages?: string[];
	/**
	 * Number of hits
	 * @automated
	 */
	hits?: number;
	/**
	 * Log reference
	 * @automated
	 */
	lastLog?: DocumentReference<LogData>;
}
