import type { CourseData } from "./types/entities";
import { onCreated, onUpdated } from "./utils/event";
import { functionsFirestore } from "./utils/initialize";

async function getLECode(code = ""): Promise<string | undefined | void> {
	const instanceRef = functionsFirestore.collection("instances").doc("live");
	const instance = (await instanceRef.get()).data();
	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = instance?.config || {};
	const losEstudiantesCourses = `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	const slugValues = code.split("-");
	let isValidUrl = false;

	do {
		const path = `${losEstudiantesCourses}/${code}`;
		const headRq = new Request(path, { method: "HEAD" });

		const { status } = await fetch(headRq);

		isValidUrl = status === 200;

		if (!isValidUrl) slugValues.pop();
	} while (!isValidUrl && slugValues.length);

	if (isValidUrl) return slugValues.join("-");
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
		losEstudiantesCode: await getLECode(code),
	};
});
export const onUpdatedCourse = onUpdated<CourseData>(
	"courses",
	async (newSnapshot, existingSnapshot) => {
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

		const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

		return {
			unreported,
			groupCount,
			spotsCount,
			programsIndexes: { ...programs },
			typologiesIndexes: { ...typologies },
			losEstudiantesCode: losEstudiantesCode || (await getLECode(code)),
		};
	}
);
