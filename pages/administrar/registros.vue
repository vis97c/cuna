<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Registros</h2>
				<p class="--txtSize-lg">Supervisa los registros de vanano</p>
			</div>
		</div>
		<PaginatedTable
			:page="logsPage"
			url="api:all:logs"
			:table-props="{
				deleteNode: useDocumentDelete,
				properties: [
					{
						value: 'createdBy',
						alias: 'Creado por',
					},
				],
			}"
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
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	import type { Log } from "~/resources/types/entities";

	/**
	 * Developer logs page
	 *
	 * @page
	 */
	definePageMeta({
		title: "Registros",
		middleware: ["can-develop"],
	});

	const logsPage: iGetPage<Log> = (pagination) => {
		return useFetchQuery<iPage<Log> | undefined>("/api/all/logs", pagination);
	};
</script>
