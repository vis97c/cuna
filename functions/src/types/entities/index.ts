import type { AuditData } from "./member";

export * from "./course.ts";
export * from "./instance.ts";
export * from "./member.ts";
export * from "./teacher.ts";
export * from "./note.ts";
export * from "./log.ts";

/**
 * Proxy
 * Keep track of proxies behavior
 *
 * @collection proxies
 */
export interface ProxyData extends AuditData {
	/**
	 * The proxy address
	 * @example socks4://68.71.249.153:48606
	 */
	proxy?: string;
	/* Prevent using this proxy */
	disabled?: boolean;
	/** How many times the proxy failed */
	timesDead?: number;
	/** How many times the proxy succeded */
	timesAlive?: number;
	/**
	 * timesDead / timesAlive ratio
	 * Any number lower than 1 is better
	 *
	 * @automation @cache
	 */
	score?: number;
	/**
	 * How much time in average did the check take in seconds
	 *
	 * @automation
	 */
	timeout?: number;
	/**
	 * How much time in average did a session (scraping) take in seconds
	 *
	 * @automation
	 */
	sessionTimeout?: number;
}
