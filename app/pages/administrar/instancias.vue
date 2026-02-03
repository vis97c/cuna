<template>
	<section id="admin-instances" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Instancias</h2>
				<p class="--txtSize-lg">Supervisa las instancias de {{ appName }}</p>
			</div>
		</div>
		<XamuPaginationContentTable
			:page="instancesPage"
			url="api:all:instances"
			:map-node="mapInstance"
			:defaults="{ page: true, level: 1 }"
			:table-props="{
				deleteNode: useDocumentDelete,
				properties: [
					{ value: 'createdBy', alias: 'Creado por' },
					{ value: 'locationCountry', hidden: true },
					{ value: 'locationState', hidden: true },
					{ value: 'locationCity', hidden: true },
					{ value: 'location', component: ValueLocation },
				],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando instancias..."
			no-content-message="No hay instancias disponibles"
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

	import type { ExtendedInstance } from "~/utils/types";

	import { ValueLocation } from "#components";

	/**
	 * Developer instances page
	 *
	 * @page
	 */
	definePageMeta({ title: "Instancias", middleware: ["can-develop"] });

	const { appName } = useRuntimeConfig().public;

	const instancesPage: iGetPage<ExtendedInstance> = (pagination) => {
		return useQuery<iPage<ExtendedInstance> | undefined>("/api/all/instances", {
			query: pagination,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	function mapInstance(node: ExtendedInstance) {
		const { instagramId, tiktokId, twitterId, facebookId, ...instance } = useMapInstance(node);

		return {
			...instance,
			location: true,
			social: {
				instagramId,
				tiktokId,
				twitterId,
				facebookId,
			},
		};
	}
</script>
