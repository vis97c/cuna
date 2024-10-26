<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100">
			<div class="holder flx --flxColumn --flx-center">
				<div class="--txtAlign-center">
					<h1 class="--txtSize-mx:md">
						<b>Cuna</b>
					</h1>
					<p class="">Cupos UNAL</p>
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
		path_label: "Inicio",
		title: "Inicio",
	});
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>
