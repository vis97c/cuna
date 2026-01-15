import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";

import type { CourseData, ExtendedInstanceData } from "./types/entities/index.js";
import { getLESlug } from "./utils/data.js";

function getLEPath({ config = {} }: ExtendedInstanceData): string {
	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

	return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
}

// courses timestamp
export const onCreatedCourse = onCreated<CourseData>(
	"courses",
	async (snapshot) => {
		const { code, groups = [], programs = [], typologies = [] } = snapshot.data();

		const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

		return {
			groupCount: groups.length,
			spotsCount,
			programsIndexes: { ...programs },
			typologiesIndexes: { ...typologies },
			losEstudiantesCode: await getLESlug(code, getLEPath),
		};
	},
	{
		defaults: {
			lock: false,
		},
	}
);
export const onUpdatedCourse = onUpdated<CourseData>(
	"courses",
	async (newSnapshot, existingSnapshot, { logger }) => {
		try {
			let { unreported } = newSnapshot.data();
			const {
				code,
				losEstudiantesCode,
				groups = [],
				programs = [],
				typologies = [],
			} = newSnapshot.data();
			const existing = existingSnapshot.data();
			const existingGroupCount = existing.groups?.length || 0;
			const groupCount = groups.length || 0;

			// remove unreported when new groups are added
			if (groupCount > existingGroupCount) unreported = undefined;

			const spotsCount = groups.reduce(
				(sum, { availableSpots = 0 }) => sum + availableSpots,
				0
			);

			return {
				unreported,
				groupCount,
				spotsCount,
				programsIndexes: { ...programs },
				typologiesIndexes: { ...typologies },
				losEstudiantesCode: losEstudiantesCode || (await getLESlug(code, getLEPath)),
			};
		} catch (err) {
			logger("functions:courses:onUpdatedCourse", err);

			throw err;
		}
	}
);
