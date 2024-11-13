import { kebabCase } from "lodash";
import type { InstanceData } from "../types/entities";
import { functionsFirestore } from "./initialize";

export async function getLESlug(
	value = "",
	buildPath: (c: InstanceData) => string
): Promise<string> {
	const instanceRef = functionsFirestore.collection("instances").doc("live");
	const instance = <InstanceData>(await instanceRef.get()).data() || {};
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
