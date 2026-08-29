import type { tOptionsLoaderFn, iPageEdge, iSelectOption } from "@open-xamu-co/ui-common-types";

import type { Course } from "~/utils/types";
import type { OutputFromData } from "~/utils/types/entities/base";
import type { SearchData } from "~~/functions/src/types/entities/base";

export function makeFetchInputOptions<T extends OutputFromData<SearchData>>(
	endpoint: string,
	{ withSlug, ...overrides }: Record<string, any> & { withSlug?: boolean } = {}
): tOptionsLoaderFn {
	return async (nameOrId, signal) => {
		if (!nameOrId || typeof nameOrId !== "string") return [];

		const query: Record<string, any> = { first: 10, ...overrides };

		if (nameOrId.includes("/")) query.id = getDocumentId(nameOrId);
		else query.name = nameOrId;

		const edges = await customFetch<iPageEdge<T>[]>(endpoint, {
			signal,
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
			query,
		});

		return edges.map(({ node }, index): iSelectOption => {
			return { value: (withSlug ? node.slug : node.id) || index, alias: node.name };
		});
	};
}

// Admin endpoints
export const fetchAdminCoursesOptions = makeFetchInputOptions<Course>(
	"/api/admin/instance/courses"
);
