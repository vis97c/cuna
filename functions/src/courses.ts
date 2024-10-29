import type { CourseData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";

// courses timestamp
export const onCreatedCourse = onCreated<CourseData>("courses", (snapshot) => {
	const { groups = [] } = snapshot.data();

	const spotsCount = groups.map(({ spots = 0 }) => spots).reduce((sum, spots) => sum + spots, 0);

	return { groupCount: groups.length, spotsCount };
});
export const onUpdatedCourse = onUpdated<CourseData>("courses", (newSnapshot, existingSnapshot) => {
	const { groups = [], groupCount: updatedGroupCount } = newSnapshot.data();
	const existing = existingSnapshot.data();
	const existingGroupCount = existing.groups?.length || 0;
	const groupCount = groups.length || 0;

	if (updatedGroupCount !== undefined && existingGroupCount === groupCount) return;

	const spotsCount = groups.map(({ spots = 0 }) => spots).reduce((sum, spots) => sum + spots, 0);

	return { groupCount, spotsCount };
});
