<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Cursos</h2>
				<p class="--txtSize-lg">Supervisa los cursos de cuna</p>
			</div>
		</div>
		<PaginatedTable
			:page="coursesPage"
			url="api:courses"
			:map-node="mapCourse"
			:defaults="{ level: 1 }"
			:table-props="{
				childrenName: 'Registros',
				childrenCountKey: 'logs',
				deleteNode: useDocumentDelete,
				properties: [{ value: 'createdBy', alias: 'Creado por' }],
			}"
			client
		>
			<template #headActions="{ refreshData }">
				<XamuActionButtonToggle
					tooltip="Actualizar"
					tooltip-position="right"
					round
					@click="refreshData"
				>
					<XamuIconFa name="rotate-right" />
					<XamuIconFa name="rotate-right" regular />
				</XamuActionButtonToggle>
			</template>
			<template #tableChildren="{ show, node }">
				<PaginatedTable
					:page="makeCourseLogsPage(node.course)"
					:url="`api:courses:${getDocumentId(node.course.id)}:logs`"
					:prevent-autoload="!show"
					:defaults="{ level: 1 }"
					:table-props="{
						nested: true,
						deleteNode: useDocumentDelete,
						properties: [{ value: 'createdBy', alias: 'Creado por' }],
					}"
					client
				>
					<template #headActions="{ refreshData }">
						<XamuActionButtonToggle
							tooltip="Actualizar"
							tooltip-position="right"
							round
							@click="refreshData"
						>
							<XamuIconFa name="rotate-right" />
							<XamuIconFa name="rotate-right" regular />
						</XamuActionButtonToggle>
					</template>
				</PaginatedTable>
			</template>
		</PaginatedTable>
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	import type { Course } from "~/resources/types/entities";
	import { getDocumentId } from "~/resources/utils/firestore";

	/**
	 * Developer courses page
	 *
	 * @page
	 */
	definePageMeta({
		title: "Cursos",
		middleware: ["can-develop"],
	});

	function mapCourse(course: Course) {
		return {
			id: course.id,
			code: course.code,
			scrapedAt: course.scrapedAt,
			updatedBy: course.updatedBy,
			course,
			logs: 1,
		};
	}

	const coursesPage: iGetPage<Course> = (pagination) => {
		return useFetchQuery<iPage<Course> | undefined>("/api/courses", pagination);
	};

	function makeCourseLogsPage(course: Course): iGetPage<Course> {
		return function (pagination) {
			return useFetchQuery<iPage<Course> | undefined>(
				`/api/courses/${getDocumentId(course.id)}/logs`,
				pagination
			);
		};
	}
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.box {
			box-shadow: none;
		}
	}
</style>
