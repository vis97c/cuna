import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { getSearchIndexes } from "@open-xamu-co/firebase-nuxt/functions/search";

import type { CourseData, ExtendedInstanceData, GroupData } from "./types/entities/index.js";
import { getLESlug } from "./utils/data.js";

function getLEPath({ config = {} }: ExtendedInstanceData): string {
	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

	return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
}

/**
 * Create timestamp
 *
 * @docType course
 * @event created
 */
export const onCreatedCourse = onCreated<CourseData>(
	"instances/courses",
	async (snapshot) => {
		const { name = "", code, programs = [], typologies = [] } = snapshot.data();
		// Get search indexes
		const indexes = getSearchIndexes(name);

		return {
			indexes,
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
/**
 * Update timestamp
 *
 * @docType course
 * @event updated
 */
export const onUpdatedCourse = onUpdated<CourseData>(
	"instances/courses",
	async (newSnapshot, _existingSnapshot, { logger }) => {
		try {
			const { code, losEstudiantesCode, programs = [], typologies = [] } = newSnapshot.data();

			return {
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

/**
 * Create timestamp
 *
 * @docType group
 * @event created
 */
export const onCreatedGroup = onCreated<GroupData>("instances/courses/groups", undefined, {
	defaults: {
		lock: false,
	},
});
/**
 * Update timestamp
 *
 * @docType group
 * @event updated
 */
export const onUpdatedGroup = onUpdated<GroupData>("instances/courses/groups");
