import type { CourseData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";

// courses timestamp
export const onCreatedCourse = onCreated<CourseData>("courses", (snapshot) => {
	const created = snapshot.data();

	return { groupCount: created.groups?.length || 0 };
});
export const onUpdatedCourse = onUpdated("courses", (newSnapshot, oldSnapshot) => {
	const updated = newSnapshot.data();
	const old = oldSnapshot.data();
	const oldGroupCount = old.groups?.length || 0;
	const updatedGroupCount = updated.groups?.length || 0;

	if (updated.groupCount !== undefined && oldGroupCount === updatedGroupCount) return;

	return { groupCount: updatedGroupCount };
});
