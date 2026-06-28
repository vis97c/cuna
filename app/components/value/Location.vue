<template>
	<span v-if="city">{{ city }}, {{ state }}</span>
	<span v-else>-</span>
</template>

<script setup lang="ts">
	import { computed } from "vue";

	/**
	 * Value location
	 *
	 * @component
	 */
	defineOptions({ name: "ValueLocation" });

	const props = defineProps<{
		value: any;
		node?: {
			locationCity?: string;
			locationState?: string;
			locationCountry?: string;
			user?: {
				locationCity?: string;
				locationState?: string;
				locationCountry?: string;
			};
		};
	}>();

	const city = computed(() => {
		const { locationCity, user } = props.node || {};

		return locationCity || user?.locationCity;
	});

	const state = computed(() => {
		const { locationState, user } = props.node || {};

		return locationState || user?.locationState;
	});

	// const country = computed(() => {
	// 	const { locationCountry, user } = props.node || {};

	// 	return locationCountry || user?.locationCountry;
	// });
</script>
