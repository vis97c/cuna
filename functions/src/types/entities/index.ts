import type { SharedData } from "@open-xamu-co/firebase-nuxt/functions";

export * from "./course";
export * from "./instance";
export * from "./user";
export * from "./teacher";
export * from "./note";

/**
 * Proxy
 * Keep track of proxies behavior
 *
 * @collection proxies
 */
export interface ProxyData extends SharedData {
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
}
