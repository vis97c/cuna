import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import type { FetchResponse } from "ofetch";

/**
 * Inject auth headers and refresh token
 *
 * @param baseOptions
 * @returns
 */
async function getQueryOptions<R extends NitroFetchRequest = NitroFetchRequest>(
	baseOptions?: NitroFetchOptions<R>
): Promise<NitroFetchOptions<R>> {
	const SESSION = useSessionStore();
	const { $clientAuth } = useNuxtApp();
	const { cache, production } = useRuntimeConfig().public;
	const { query, ...options } = { ...baseOptions };
	const headers: Record<string, any> = {
		...useRequestHeaders(), // Server headers (required for instance)
		authorization: SESSION.token || "",
		"Cache-Control": cache.frequent,
		...options?.headers, // Overrides
		"Xamu-Context-Source": import.meta.client ? "client" : "server",
	};

	// Refresh token, before server request (required for auth)
	if (SESSION.member) {
		if (import.meta.client) {
			const freshToken = await $clientAuth?.currentUser?.getIdToken();

			headers.authorization = freshToken || headers.authorization;
		}

		SESSION.setMember(SESSION.member, headers.authorization);
	}

	// Bypass cache for development
	if (!production) {
		headers["Cache-Control"] = "no-store";
		options.cache = "no-store";
	}

	return { ...options, query, headers };
}

/**
 * oFetch wrapper
 *
 * Refresh auth token before each request
 * @see https://stackoverflow.com/questions/47803495/error-firebase-id-token-has-expired
 */
export async function customFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw?: false
): Promise<T>;
export async function customFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw?: true
): Promise<FetchResponse<T>>;
export async function customFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw = false
): Promise<T | FetchResponse<T>> {
	const options = await getQueryOptions<R>(baseOptions);

	if (raw) {
		// TypeScript seems to forgot how to infer the return type of $fetch.raw
		return $fetch.raw(url, { credentials: "omit", ...options }) as unknown as FetchResponse<T>;
	}

	return <T>$fetch(url, { credentials: "omit", ...options });
}

/**
 * Fetch wrapper with csrf token
 */
export async function customCsrfFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw?: false
): Promise<T>;
export async function customCsrfFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw?: true
): Promise<FetchResponse<T>>;
export async function customCsrfFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>,
	raw = false
): Promise<T | FetchResponse<T>> {
	const { $csrfFetch } = useNuxtApp() as unknown as { $csrfFetch: any };
	const { responseType, ...options } = await getQueryOptions(baseOptions);

	if (raw)
		return $csrfFetch.raw(url, {
			credentials: "same-origin",
			...options,
		}) as unknown as FetchResponse<T>;

	return $csrfFetch(url, { credentials: "same-origin", ...options }) as Promise<T>;
}
