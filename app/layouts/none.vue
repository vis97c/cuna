<template>
	<main ref="layoutRef" class="x-layout scrollable">
		<slot></slot>
	</main>
</template>

<script setup lang="ts">
	/**
	 * None layout
	 *
	 * @layout admin layer
	 */
</script>

<style lang="scss" scoped>
	@media only screen {
		.x-layout {
			overflow: hidden auto;
			transition: background 0.5s ease;
		}
	}
</style>
