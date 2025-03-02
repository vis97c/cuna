import type { InstanceData, TeacherData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";
import { getLESlug } from "./utils/data";
import { functionLogger } from "./utils/initialize";

function getLEPath({ config = {} }: InstanceData): string {
	const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } = config;

	return `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;
}

// teachers timestamp
export const onCreatedTeacher = onCreated<TeacherData>("teachers", async (snapshot) => {
	try {
		const { name } = snapshot.data();

		return { losEstudiantesSlug: await getLESlug(name, getLEPath) };
	} catch (err) {
		functionLogger("functions:teachers:onCreatedTeacher", err);

		throw err;
	}
});
export const onUpdatedTeacher = onUpdated<TeacherData>("teachers", async (snapshot) => {
	try {
		const { name, losEstudiantesSlug } = snapshot.data();

		return { losEstudiantesSlug: losEstudiantesSlug || (await getLESlug(name, getLEPath)) };
	} catch (err) {
		functionLogger("functions:teachers:onUpdatedTeacher", err);

		throw err;
	}
});
