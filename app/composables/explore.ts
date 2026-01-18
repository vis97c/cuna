import type { iPageEdge } from "@open-xamu-co/ui-common-types";

import type { Course } from "~/utils/types";

/**
 * Index unindexed explorer (v1/v2) courses
 *
 * @legacy explorer v1/v2 no longer working
 */
export async function indexCourses(courses: Course[]) {
	const Swal = useSwal();

	try {
		const include = courses.map(({ id }) => id);
		const indexedCoursesEdges = await useQuery<iPageEdge<Course, string>[]>(
			"/api/instance/all/courses",
			{ query: { include } }
		);

		const mappedCourses: (Course & { indexed?: Course })[] = courses.map((course) => {
			const indexed = indexedCoursesEdges.find(({ node }) => node.id === course.id)?.node;

			return { ...course, indexed };
		});

		// Conditionally Refresh UI again
		// if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
		// 	untrackedCourses.value = mappedCourses;
		// 	savedUntrackedCourses.value[page.currentPage] = mappedCourses;
		// }

		// Index or update courses
		const allIndexed = await Promise.all(
			mappedCourses.map(async ({ indexed, ...course }) => {
				// Force array type
				if (indexed?.programs && !Array.isArray(indexed?.programs)) {
					indexed.programs = [];
				}

				// Set course
				await useIndexCourse(course, indexed);

				return {
					...course,
					spotsCount: indexed?.spotsCount || course.spotsCount,
					groupCount: indexed?.groupCount || course.groupCount,
					groups: indexed?.groups || course.groups,
					updatedAt: indexed?.updatedAt,
					scrapedAt: indexed?.scrapedAt,
					indexed: true,
				};
			})
		);

		// Conditionally Refresh UI again, 2nd time
		// if (untrackedCurrentPage.value?.currentPage === page.currentPage) {
		// 	untrackedCourses.value = allIndexed;
		// 	savedUntrackedCourses.value[page.currentPage] = allIndexed;
		// }

		return allIndexed;
	} catch (err) {
		useAppLogger("components:SearchCourse:indexCourses", err);
		// errors.value = err;

		Swal.fire({
			title: "Error de indexado",
			text: "Ha ocurrido un error al indexar los cursos",
			icon: "error",
			// target: searchUntrackedRef.value,
		});
	}
}
