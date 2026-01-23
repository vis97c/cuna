import { FieldValue } from "firebase-admin/firestore";
import deburr from "lodash-es/deburr.js";

import { onCreated, onDeleted, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { getWeightedSearchIndexes } from "@open-xamu-co/firebase-nuxt/functions/search";

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
		const {
			name = "",
			code,
			programs = [],
			typologies = [],
			indexes: existingIndexes,
			indexesWeights: existingIndexesWeights,
		} = snapshot.data();

		// Assume pre-indexed
		if (existingIndexes && existingIndexesWeights) {
			return { losEstudiantesCode: await getLESlug(code, getLEPath) };
		}

		// Get search indexes
		const { indexes, indexesWeights } = getWeightedSearchIndexes(name);

		return {
			indexes,
			indexesWeights,
			alternativeNames: [name, deburr(name)],
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
			const {
				name = "",
				code,
				programs = [],
				typologies = [],
				losEstudiantesCode,
				indexes: existingIndexes,
				indexesWeights: existingIndexesWeights,
			} = newSnapshot.data();

			// Assume pre-indexed
			if (existingIndexes && existingIndexesWeights) {
				return {
					losEstudiantesCode: losEstudiantesCode || (await getLESlug(code, getLEPath)),
				};
			}

			// Get search indexes
			const { indexes, indexesWeights } = getWeightedSearchIndexes(name);

			// Keep valid indexes
			return {
				indexes,
				indexesWeights,
				alternativeNames: [name, deburr(name)],
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
 * Delete timestamp
 *
 * @docType course
 * @event deleted
 */
export const onDeletedCourse = onDeleted<CourseData>("instances/courses", async (deleted) => {
	const instanceRef = deleted.ref.parent.parent;
	const teachersRef = instanceRef?.collection("teachers");
	const teachersQuery = teachersRef?.where("coursesRefs", "array-contains", deleted.ref);
	const groupsRef = deleted.ref.collection("groups");

	// Get snapshots
	const [groupsSnapshot, teachersSnapshot] = await Promise.all([
		groupsRef.get(),
		teachersQuery?.get(),
	]);

	// Remove groups
	await Promise.allSettled(groupsSnapshot.docs.map((group) => group.ref.delete()));

	// Remove course from teachers
	if (teachersSnapshot?.docs.length) {
		const coursesRefs = FieldValue.arrayRemove(deleted.ref);

		await Promise.allSettled(
			teachersSnapshot.docs.map(({ ref }) => ref.update({ coursesRefs }))
		);
	}
});

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
 * Preserve max spots amount to compare with available spots
 *
 * @docType group
 * @event updated
 */
export const onUpdatedGroup = onUpdated<GroupData>(
	"instances/courses/groups",
	async (newSnapshot, existingSnapshot, { logger }) => {
		try {
			const { availableSpots = 0, spots = availableSpots } = newSnapshot.data();
			const { spots: oldSpots = 0 } = existingSnapshot.data();

			// Preserve spots
			return { spots: Math.max(oldSpots, spots) };
		} catch (err) {
			logger("functions:courses:onUpdatedGroup", err);

			throw err;
		}
	}
);
