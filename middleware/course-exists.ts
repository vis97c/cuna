import type { Course } from "~/resources/types/entities";

/**
 * Auths into the store
 *
 * @middleware
 */
export default defineNuxtRouteMiddleware(async ({ params }) => {
	const courseId = <string>params.courseId;
	let statusCode: number | undefined;

	await useFetchQuery<Course>(`/api/all/courses/${courseId}`, {
		options: {
			method: "HEAD",
			onResponse({ response }) {
				statusCode = response.status;
			},
		},
	});

	if (statusCode === 200) return;

	return abortNavigation({
		fatal: true,
		statusCode: 404,
		statusMessage: "El curso que buscas no esta indexado o no existe.",
	});
});
