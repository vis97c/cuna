<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Ofensores</h2>
				<p class="--txtSize-lg:md">Supervisa los ofensores del sitio</p>
			</div>
		</div>
		<XamuPaginationContentTable
			:page="offendersPage"
			url="api:instance:all:offenders"
			:map-node="useMapOffender"
			:defaults="{ page: true, level: 1 }"
			:table-props="{
				deleteNode: useDocumentDelete,
				properties: [
					{ value: 'createdBy', alias: 'Creado por' },
					{ value: 'lock', hidden: true },
					{ value: 'ip', component: ValueIP },
				],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando ofensores..."
			no-content-message="No hay ofensores registrados"
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
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import type { Offender } from "@open-xamu-co/firebase-nuxt/client";

	import { ValueIP } from "#components";

	/**
	 * Offenders page
	 *
	 * @page
	 */
	definePageMeta({ title: "Ofensores", middleware: ["can-develop"] });

	const offendersPage: iGetPage<Offender> = (pagination) => {
		return useQuery<iPage<Offender> | undefined>("/api/all/offenders", {
			query: pagination,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};
</script>
