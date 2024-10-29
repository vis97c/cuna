<template>
	<XamuBaseErrorBoundary>
		<NuxtPage :key="route.fullPath" />
	</XamuBaseErrorBoundary>
</template>

<script setup lang="ts">
	const route = useRoute();
</script>
