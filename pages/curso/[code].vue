<template>
	<div id="courses" class="view">
		<section class="view-item --minHeightVh-100">
			<div class="holder flx --flxColumn --flx-center">
				<div class="--txtAlign-center">
					<h1 class="--txtSize-mx:md">
						<b>Curso</b>
					</h1>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		title: "Curso",
	});
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>
