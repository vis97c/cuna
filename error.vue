<template>
	<div id="error" class="view">
		<section class="view-item --bgColor-light">
			<div class="holder">
				<div class="flx --flxColumn --flx-center">
					<div class="txt --txtAlign-center --gap">
						<h1 class="--txtSize-mx">{{ error.statusCode }}</h1>
						<h4>{{ errorMessage.replaceAll(".", "") }}.</h4>
						<template v-if="error.statusCode >= 500 && error.statusCode <= 599">
							<p>Puedes intentar:</p>
							<div class="flx --flxRow-wrap --flx-center">
								<XamuActionLink
									aria-label="Reintentar"
									:href="`/?restricted=${encodeURI(route.fullPath)}`"
									rel="noopener"
									target="_self"
								>
									<span>Reintentar</span>
								</XamuActionLink>
								<XamuActionLink
									v-if="SESSION.token"
									aria-label="Cerrar sesion y reintentar"
									@click="
										clearError();
										SESSION.unsetSession();
									"
								>
									<span>Cerrar sesion y reintentar</span>
								</XamuActionLink>
							</div>
						</template>
						<XamuActionLink
							v-else
							rel="noopener"
							@click="clearError({ redirect: '/' })"
						>
							Volver al inicio
						</XamuActionLink>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		error: {
			type: Object,
			required: true,
		},
	});

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const route = useRoute();
	const { indexable } = useRuntimeConfig().public;

	const errorMessage = computed<string>(() => {
		if (props.error.message) return props.error.message;

		switch (props.error.statusCode) {
			case 404:
				return "La página que buscas esta errada o no existe";
			case 503:
				return "Error interno del servidor";
			default:
				return "Error desconocido";
		}
	});

	// lifecycle
	useHead(() => {
		const newMeta: Record<string, any> = {
			title: `Error ${props.error.statusCode} ⋅ ${APP.instance?.name || "NO DB"}`,
		};

		if (!indexable || !!route.meta.noindex) {
			newMeta.meta = [{ name: "robots", content: "noindex, nofollow" }];
		}

		return newMeta;
	});
</script>

<style lang="scss" scoped>
	@use "@/assets/scss/overrides";
	@use "@open-xamu-co/ui-styles/src/utils/module" as utils;

	@media only screen {
		#error .view-item {
			min-height: 100dvh;
		}
	}
</style>
