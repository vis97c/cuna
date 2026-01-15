<template>
	<div id="disabled" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder">
				<div class="flx --flxColumn --flx-center">
					<div class="txt --txtAlign-center --gap-30">
						<div>
							<h1>Instancia deshabilitada</h1>
							<h3>La instancia que buscas no esta disponible.</h3>
						</div>
						<p>
							¿Es tu instancia?
							<XamuActionLink to="/ingresar">Inicia sesión.</XamuActionLink>
						</p>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	/**
	 * Disabled page
	 * An instance can be disabled due to a lack of payment
	 *
	 * @page
	 */

	definePageMeta({
		title: "Deshabilitado",
		layout: "none",
		noindex: true,
	});
</script>
