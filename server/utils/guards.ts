export function isNumberOrString(v: unknown): v is number | string {
	return ["number", "string"].includes(typeof v);
}

export function isFileArray<T>(values?: File[] | T[]): values is File[] {
	return !values?.every((v) => Array.isArray(v));
}

export function getBoolean(value?: unknown, prefer?: boolean): boolean {
	if (value && typeof value === "string") {
		return value.toUpperCase() === "TRUE";
	}

	return !!prefer;
}
