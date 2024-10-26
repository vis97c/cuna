export function getBoolean(value?: unknown, prefer?: boolean): boolean {
	if (value && typeof value === "string") {
		return value.toUpperCase() === "TRUE";
	}

	return !!prefer;
}
