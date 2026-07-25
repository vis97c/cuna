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
				properties: [
					{ value: 'lock', hidden: true },
					{ value: 'proxy', component: ({ value }) => h('span', value) },
				],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando proxies..."
			no-content-message="No hay proxies registrados"
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
		</XamuPaginationContentTable>
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	import type { Proxy } from "~/utils/types/index.ts";

	/**
	 * Proxies page
	 *
	 * @page
	 */
	definePageMeta({ title: "Proxies", middleware: ["can-develop"] });

	const proxiesPage: iGetPage<Proxy> = (pagination) => {
		return customFetch<iPage<Proxy> | undefined>("/api/admin/proxies", {
			method: "POST",
			query: pagination,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};
</script>
