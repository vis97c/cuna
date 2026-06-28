<template>
	<XamuActionLink
		v-if="ip"
		v-bind="{
			href: `https://checkip.me/check.php?ip=${ip}`,
			target: '_blank',
			tooltip: 'Ver detalles de la IP',
			tooltipAsText: true,
			theme: mappedNode?.theme,
		}"
	>
		{{ ip }}
	</XamuActionLink>
	<span v-else>-</span>
</template>

<script setup lang="ts">
	import { computed } from "vue";

	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";

	/**
	 * Value location
	 *
	 * @component
	 */
	defineOptions({ name: "ValueIP" });

	const props = defineProps<{
		value: number;
		node?: {
			ip?: string;
		};
		mappedNode?: {
			theme?: tThemeTuple | tProp<tThemeModifier>;
		};
	}>();

	const ip = computed(() => {
		const { ip } = props.node || {};

		return ip;
	});
</script>
