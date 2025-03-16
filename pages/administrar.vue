<template>
	<div class="flx --flxColumn --flx-center-stretch --flx-fill --width-100">
		<NuxtPage />
	</div>
</template>

<script setup lang="ts">
	/**
	 * Admin root
	 *
	 * @root
	 */
	definePageMeta({ middleware: ["auth-only", "can-develop"], noindex: true });
</script>
