<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Cursos</h2>
				<p class="--txtSize-lg">Supervisa los cursos de cuna</p>
			</div>
		</div>
		<XamuPaginationContentTable
			:page="coursesPage"
			url="api:instance:courses"
			:map-node="mapCourse"
			:defaults="{ page: true, level: 1 }"
			:table-props="{
				childrenName: 'Registros',
				childrenCountKey: 'logs',
				deleteNode: useDocumentDelete,
				properties: [{ value: 'createdBy', alias: 'Creado por' }],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando cursos..."
			no-content-message="No hay cursos disponibles"
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
				<XamuPaginationContentTable
					:page="makeCourseLogsPage(node)"
					:url="`api:courses:${getDocumentId(node.id)}:logs`"
					:prevent-autoload="!show"
					:defaults="{ page: true, level: 1 }"
					:table-props="{
						nested: true,
						deleteNode: useDocumentDelete,
						properties: [{ value: 'createdBy', alias: 'Creado por' }],
						modalProps: {
							invertTheme: true,
							class: '--txtColor',
						},
					}"
					label="Cargando registros..."
					no-content-message="No hay registros disponibles"
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
				</XamuPaginationContentTable>
			</template>
		</XamuPaginationContentTable>
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
			// updatedBy: course.updatedBy,
			course,
			logs: course.logs || 0,
		};
	}

	const coursesPage: iGetPage<Course> = (query) => {
		return useQuery<iPage<Course> | undefined>("/api/instance/all/courses", {
			query,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	function makeCourseLogsPage(course: Course): iGetPage<Course> {
		return function (query) {
			return useQuery<iPage<Course> | undefined>(
				`/api/instance/courses/${getDocumentId(course.id)}/logs`,
				{
					query,
					credentials: "omit",
					headers: { "Cache-Control": "no-store" },
					cache: "no-store",
				}
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
