import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";

import type { ExtendedInstanceData, TeacherData } from "./types/entities/index.js";
import { getLESlug } from "./utils/data.js";

function getLEPath({ config = {} }: ExtendedInstanceData): string {
	const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } = config;

	return `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;
}

// teachers timestamp
export const onCreatedTeacher = onCreated<TeacherData>(
	"teachers",
	async (snapshot, { logger }) => {
		try {
			const { name } = snapshot.data();

			return { losEstudiantesSlug: await getLESlug(name, getLEPath) };
		} catch (err) {
			logger("functions:teachers:onCreatedTeacher", err);

			throw err;
		}
	},
	{
		defaults: {
			lock: false,
		},
	}
);
export const onUpdatedTeacher = onUpdated<TeacherData>(
	"teachers",
	async (snapshot, _oldSnapshot, { logger }) => {
		try {
			const { name, losEstudiantesSlug } = snapshot.data();

			return { losEstudiantesSlug: losEstudiantesSlug || (await getLESlug(name, getLEPath)) };
		} catch (err) {
			logger("functions:teachers:onUpdatedTeacher", err);

			throw err;
		}
	}
);
