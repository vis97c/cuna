<template>
	<div id="unattended" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-none">
			<div class="holder">
				<div class="flx --flxColumn --flx-center">
					<div class="txt --txtAlign-center --gap-30">
						<div>
							<h1>Instancia no encontrada</h1>
							<h3>La instancia que buscas no esta disponible.</h3>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	/**
	 * Unattended page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Desatendido",
		layout: "none",
		noindex: true,
	});
</script>
