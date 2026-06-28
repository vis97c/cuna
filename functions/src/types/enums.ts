/**
 * Cache control
 */
export enum eCacheControl {
	NONE = "no-cache, no-store, must-revalidate",
	/** Cache for a few minutes */
	FREQUENT = "public, max-age=120, stale-while-revalidate=60",
	/** Cache for an hour */
	NORMAL = "public, max-age=3600, must-revalidate",
	/** Cache for a month */
	MIDTERM = "public, max-age=2592000, must-revalidate",
	/** Cache for a year */
	LONGTERM = "public, max-age=31536000, must-revalidate",
}

export {};
