import type { Course } from "~/utils/types";

/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async ({ params }) => {
	const courseId = <string>params.courseId;
	let statusCode: number | undefined;

	await useQuery<Course>(`/api/all/courses/${courseId}`, {
		method: "HEAD",
		onResponse({ response }) {
			statusCode = response.status;
		},
	});

	if (statusCode === 200) return;

	return abortNavigation({
		fatal: true,
		statusCode: 404,
		statusMessage: "El curso que buscas no esta indexado o no existe.",
	});
});
