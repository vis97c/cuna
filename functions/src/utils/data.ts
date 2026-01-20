import kebabCase from "lodash-es/kebabCase.js";

import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { ExtendedInstanceData } from "../types/entities/index.js";

/**
 * Hits "los estudiantes" to check if the slug is valid
 * @param value The value to slugify
 * @param buildBasePath The base path to build the URL (courses or teachers)
 * @returns The slug
 */
export async function getLESlug(
	value = "",
	buildBasePath: (c: ExtendedInstanceData) => string
): Promise<string> {
	const { firebaseFirestore } = getFirebase("getLESlug");
	const instanceRef = firebaseFirestore.collection("instances").doc("live");
	const instance = <ExtendedInstanceData>(await instanceRef.get()).data() || {};
	const pathLE = buildBasePath(instance);
	const slugValues = kebabCase(value).split("-");
	let isValidUrl = false;

	do {
		const path = `${pathLE}/${slugValues.join("-")}`;
		const headRq = new Request(path, { method: "HEAD" });

		const { status } = await fetch(headRq);

		isValidUrl = status === 200;

		if (!isValidUrl) slugValues.pop();
	} while (!isValidUrl && slugValues.length);

	return isValidUrl ? slugValues.join("-") : "";
}
