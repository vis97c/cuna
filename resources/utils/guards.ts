export function isNotUndefString(v?: string): v is string {
	return !!v;
}

export function isNumberOrString(v: unknown): v is number | string {
	return ["number", "string"].includes(typeof v);
}

export function isFileArray<T>(values: File[] | T[]): values is File[] {
	return !values.every((v) => Array.isArray(v));
}
