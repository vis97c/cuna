<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Proxies</h2>
				<p class="--txtSize-lg:md">Supervisa los proxies del sitio</p>
			</div>
		</div>
		<XamuPaginationContentTable
			:page="proxiesPage"
			url="api:instance:proxies"
			:map-node="useMapProxy"
			:defaults="{ page: true }"
			:table-props="{
				properties: [{ value: 'lock', hidden: true }],
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

	import type { Proxy } from "~/utils/types";

	/**
	 * Proxies page
	 *
	 * @page
	 */
	definePageMeta({ title: "Proxies", middleware: ["can-develop"] });

	const proxiesPage: iGetPage<Proxy> = (pagination) => {
		return useQuery<iPage<Proxy> | undefined>("/api/all/proxies", {
			query: pagination,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};
</script>
