<template>
	<div id="courses" key="courses" class="x-course">Aqui va tu curso</div>
</template>

<script setup lang="ts">
	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		title: "Curso",
		middleware: ["auth-only"],
	});
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>
