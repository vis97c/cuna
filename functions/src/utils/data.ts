import kebabCase from "lodash-es/kebabCase.js";

import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";

import type { ExtendedInstanceData } from "../types/entities/index.js";

export async function getLESlug(
	value = "",
	buildPath: (c: ExtendedInstanceData) => string
): Promise<string> {
	const { firebaseFirestore } = getFirebase("getLESlug");
	const instanceRef = firebaseFirestore.collection("instances").doc("live");
	const instance = <ExtendedInstanceData>(await instanceRef.get()).data() || {};
	const pathLE = buildPath(instance);
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
