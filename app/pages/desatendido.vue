<template>
	<div id="unattended" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder">
				<div class="flx --flxColumn --flx-center">
					<div class="txt --txtAlign-center --gap-30">
						<div>
							<h1>Instancia no encontrada</h1>
							<h3>La instancia que buscas no esta disponible.</h3>
						</div>
						<XamuActionLink v-if="isCustomDomain" to="/">Ir al inicio</XamuActionLink>
						<template v-else-if="ROOT.current?.url">
							<p>Este podria ser el lugar perfecto para tu propia instancia.</p>
							<XamuActionLink :to="ROOT.current?.url">
								Ir a {{ ROOT.current?.poweredBy }}
							</XamuActionLink>
						</template>
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

	const ROOT = useRootStore();

	const hostname = computed(() => {
		if (!ROOT.current?.url) return "";

		const { hostname } = new URL(ROOT.current.url);

		return hostname;
	});

	const isCustomDomain = computed(() => {
		return !location?.hostname.includes(hostname.value);
	});
</script>
