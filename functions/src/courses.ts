import type { CourseData, InstanceData } from "./types/entities";
import { getLESlug } from "./utils/data";
import { onCreated, onUpdated } from "./utils/event";
import { functionLogger } from "./utils/initialize";

function getLEPath({ config = {} }: InstanceData): string {
	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

	return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
}

// courses timestamp
export const onCreatedCourse = onCreated<CourseData>("courses", async (snapshot) => {
	const { code, groups = [], programs = [], typologies = [] } = snapshot.data();

	const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return {
		groupCount: groups.length,
		spotsCount,
		programsIndexes: { ...programs },
		typologiesIndexes: { ...typologies },
		losEstudiantesCode: await getLESlug(code, getLEPath),
	};
});
export const onUpdatedCourse = onUpdated<CourseData>(
	"courses",
	async (newSnapshot, existingSnapshot) => {
		try {
			let { unreported = [] } = newSnapshot.data();
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
			if (groupCount > existingGroupCount) unreported = [];

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
			functionLogger("functions:courses:onUpdatedCourse", err);

			throw err;
		}
	}
);
