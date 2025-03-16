<template>
	<XamuBaseErrorBoundary>
		<slot v-bind="{ hasContent, refreshData }"></slot>
		<div class="flx --flxColumn --gap-30">
			<div
				v-if="!hasContent && $slots.headActions"
				class="flx --flxRow --flx-start-center --gap-10 --gap:md"
			>
				<slot name="headActions" v-bind="{ hasContent, refreshData }"></slot>
			</div>
			<XamuPaginationContent
				v-slot="{ content }"
				v-bind="{ page, url, noContentMessage, theme }"
				with-route
				:defaults="{
					page: true,
					...defaults,
				}"
				class="flx --flxColumn --flx-start-end"
				@refresh="emittedRefresh = $event"
				@has-content="hasContent = $event"
			>
				<ClientOnly>
					<XamuTable
						:nodes="mapNodes(content)"
						:refresh="refreshData"
						v-bind="{
							...tableProps,
							theme,
							modalProps: {
								invertTheme: true,
								class: '--txtColor',
								...tableProps?.modalProps,
							},
						}"
					>
						<template v-if="$slots.headActions" #headActions>
							<div class="flx --flxRow --flx-start-center --gap-10 --gap:md">
								<slot
									name="headActions"
									v-bind="{ hasContent, refreshData }"
								></slot>
							</div>
						</template>
						<template v-if="$slots.tableChildren" #default="tableChildrenScope">
							<slot
								name="tableChildren"
								v-bind="{ ...tableChildrenScope, hasContent, refreshData }"
							></slot>
						</template>
					</XamuTable>
				</ClientOnly>
			</XamuPaginationContent>
		</div>
	</XamuBaseErrorBoundary>
</template>

<script setup lang="ts" generic="T extends Record<string, any>, TM extends Record<string, any>">
	import type { iGetPage, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import type { iTableProps } from "@open-xamu-co/ui-components-vue";

	interface iPaginatedTableProps<
		Ti extends Record<string, any>,
		TMi extends Record<string, any>,
	> {
		/**
		 * Required to dedupe caching
		 */
		url: string;
		page: iGetPage<Ti>;
		defaults?: Record<string, any>;
		mapNode?: (node: Ti) => TMi;
		refresh?: () => void;
		noContentMessage?: string;
		tableProps?: Omit<iTableProps<TMi>, "nodes" | "refresh">;
		theme?: tThemeModifier | tThemeTuple;
	}

	/**
	 * Paginated Table
	 *
	 * @component
	 */

	const props = withDefaults(defineProps<iPaginatedTableProps<T, TM>>(), {
		mapNode: (node: T) => node as unknown as TM,
	});

	const hasContent = ref(false);
	const emittedRefresh = ref();

	function refreshData() {
		props.refresh?.();
		emittedRefresh.value?.();
	}

	function mapNodes(nodes: T[] = []): TM[] {
		return nodes.map(props.mapNode);
	}
</script>
