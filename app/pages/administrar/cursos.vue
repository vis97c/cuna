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
	import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	import type { Course } from "~/utils/types";

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

	const coursesPage: iGetPage<Course> = (query) => {
		return useQuery<iPage<Course> | undefined>("/api/courses", { query });
	};

	function makeCourseLogsPage(course: Course): iGetPage<Course> {
		return function (query) {
			return useQuery<iPage<Course> | undefined>(
				`/api/courses/${getDocumentId(course.id)}/logs`,
				{ query }
			);
		};
	}
</script>

<style lang="scss">
	@media only screen {
		.box {
			box-shadow: none;
		}
	}
</style>
