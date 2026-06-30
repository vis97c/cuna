import type { DocumentReference, Firestore, Query } from "firebase-admin/firestore";

import kebabCase from "lodash-es/kebabCase.js";

export function makeGetSlug(collectionId: string) {
	return async (
		at: DocumentReference | Firestore,
		name?: string,
		oldSlug?: string
	): Promise<string> => {
		let query: Query = at.collection(collectionId);
		let slug = kebabCase(name);

		if (oldSlug) query = query.where("slug", "!=", oldSlug);

		const { docs } = await query.get();
		const slugs: string[] = [];

		docs.forEach((snapshot) => {
			const blog = snapshot.data();

			if (blog.slug) slugs.push(blog.slug);
		});

		if (slugs.includes(slug)) slug += slugs.length;

		return slug;
	};
}
