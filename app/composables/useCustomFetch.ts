import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";

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
		options.credentials = "omit";
	}

	return { credentials: "same-origin", ...options, query, headers };
}

/**
 * oFetch wrapper
 *
 * Refresh auth token before each request
 * @see https://stackoverflow.com/questions/47803495/error-firebase-id-token-has-expired
 */
export async function customFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>
) {
	const options = await getQueryOptions<R>(baseOptions);

	return $fetch<T>(url, options);
}

/**
 * Fetch wrapper with csrf token
 */
export async function customCsrfFetch<T, R extends NitroFetchRequest = NitroFetchRequest>(
	url: Extract<R, string>,
	baseOptions?: NitroFetchOptions<R>
) {
	const { $csrfFetch } = useNuxtApp();
	const { responseType, ...options } = await getQueryOptions(baseOptions);

	return $csrfFetch<T>(url, options);
}
