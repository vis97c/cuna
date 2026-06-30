<template>
	<XamuActionLink v-if="tel" v-bind="{ tel, indicative, theme: mappedNode?.theme }" />
	<span v-else>-</span>
</template>

<script setup lang="ts">
	import { computed } from "vue";

	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";

	/**
	 * Value cellphone
	 *
	 * @component
	 */
	defineOptions({ name: "ValueCellphone" });

	const props = defineProps<{
		value: any;
		node?: {
			whatsappNumber?: string;
			whatsappIndicative?: `${string}+${number}`;
			user?: {
				address?: string;
				cellphoneNumber?: string;
				cellphoneIndicative?: `${string}+${number}`;
			};
		};
		mappedNode?: {
			theme?: tThemeTuple | tProp<tThemeModifier>;
		};
	}>();

	const tel = computed(() => {
		const { whatsappNumber, user } = props.node || {};

		return whatsappNumber || user?.cellphoneNumber;
	});
	const indicative = computed(() => {
		const { whatsappIndicative, user } = props.node || {};

		return whatsappIndicative || user?.cellphoneIndicative;
	});
</script>
