import { kebabCase } from "lodash";

import type { TeacherData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";
import { functionsFirestore } from "./utils/initialize";

async function getLESlug(name = ""): Promise<string | undefined | void> {
	const instanceRef = functionsFirestore.collection("instances").doc("live");
	const instance = (await instanceRef.get()).data();
	const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } = instance?.config || {};
	const losEstudiantesProfessors = `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;
	const slugValues = kebabCase(name).split("-");
	let isValidUrl = false;

	do {
		const path = `${losEstudiantesProfessors}/${slugValues.join("-")}`;
		const headRq = new Request(path, { method: "HEAD" });

		const { status } = await fetch(headRq);

		isValidUrl = status === 200;

		if (!isValidUrl) slugValues.pop();
	} while (!isValidUrl && slugValues.length);

	if (isValidUrl) return slugValues.join("-");
}

// teachers timestamp
export const onCreatedTeacher = onCreated<TeacherData>("teachers", async (snapshot) => {
	const { name } = snapshot.data();

	return { losEstudiantesSlug: await getLESlug(name) };
});
export const onUpdatedTeacher = onUpdated<TeacherData>("teachers", async (snapshot) => {
	const { name, losEstudiantesSlug } = snapshot.data();

	return { losEstudiantesSlug: losEstudiantesSlug || (await getLESlug(name)) };
});
