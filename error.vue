<template>
	<div id="error" class="view">
		<section class="view-item --bgColor-light">
			<div class="holder">
				<div class="flx --flxColumn --flx-center">
					<div class="txt --txtAlign-center --gap">
						<h1 class="--txtSize-mx">{{ error.statusCode }}</h1>
						<h4>{{ errorMessage }}.</h4>
						<template v-if="error.statusCode >= 500 && error.statusCode <= 599">
							<p>Puedes intentar:</p>
							<div class="flx --flxRow-wrap --flx-center">
								<XamuActionLink
									aria-label="Reintentar"
									:href="route.fullPath"
									rel="noopener"
									target="_self"
								>
									<span>Reintentar</span>
								</XamuActionLink>
								<XamuActionLink
									v-if="SESSION.user"
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
							v-else-if="SESSION.user"
							rel="noopener"
							@click="clearError({ redirect: '/cursos' })"
						>
							Volver al los cursos
						</XamuActionLink>
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

	const route = useRoute();
	const SESSION = useSessionStore();

	const errorMessage = computed<string>(() => {
		switch (props.error.statusCode) {
			case 404:
				return "La página que buscas esta errada o no existe";
			case 503:
				return "Error interno del servidor";
			default:
				return props.error.message;
		}
	});

	// lifecycle
	route.meta.title = props.error.statusCode;
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
