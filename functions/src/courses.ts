import type { CourseData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";

// courses timestamp
export const onCreatedCourse = onCreated<CourseData>("courses", (snapshot) => {
	const { groups = [], programs = [], typologies = [] } = snapshot.data();

	const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return {
		groupCount: groups.length,
		spotsCount,
		programsIndexes: { ...programs },
		typologiesIndexes: { ...typologies },
	};
});
export const onUpdatedCourse = onUpdated<CourseData>("courses", (newSnapshot, existingSnapshot) => {
	let { unreported = [] } = newSnapshot.data();
	const {
		groups = [],
		groupCount: updatedGroupCount,
		programs = [],
		typologies = [],
	} = newSnapshot.data();
	const existing = existingSnapshot.data();
	const existingGroupCount = existing.groups?.length || 0;
	const groupCount = groups.length || 0;

	if (updatedGroupCount !== undefined && existingGroupCount === groupCount) return;
	// remove unreported when new groups are added
	if (groupCount > existingGroupCount) unreported = [];

	const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return {
		unreported,
		groupCount,
		spotsCount,
		programsIndexes: { ...programs },
		typologiesIndexes: { ...typologies },
	};
});
