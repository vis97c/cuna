export function getQueryString(name: string, params: Record<string, any>): string {
	return Array.isArray(params[name]) ? params[name][0] : String(params[name] ?? "");
}
