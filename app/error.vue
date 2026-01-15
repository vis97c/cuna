<template>
	<XamuBaseWrapper :wrap="!!INSTANCE.current?.id" :wrapper="NuxtLayout" with-errors>
		<div id="error" class="view">
			<section class="view-item --minHeightVh-100 --bgColor">
				<div class="holder">
					<div class="flx --flxColumn --flx-center">
						<div class="txt --txtAlign-center --gap">
							<h1 class="--txtSize-mx">{{ error.statusCode }}</h1>
							<h4>{{ errorMessage }}.</h4>
							<template v-if="error.statusCode >= 500 && error.statusCode <= 599">
								<p>Puedes intentar:</p>
								<div class="flx --flxRow-wrap --flx-center">
									<XamuActionLink
										:href="route?.fullPath"
										rel="noopener"
										target="_self"
									>
										Reintentar
									</XamuActionLink>
									<XamuActionLink
										v-if="USER.token"
										@click="
											clearError();
											USER.unsetSession();
										"
									>
										Cerrar sesión y reintentar
									</XamuActionLink>
								</div>
							</template>
							<XamuActionLink
								v-else-if="INSTANCE.current?.id"
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
	</XamuBaseWrapper>
</template>

<script setup lang="ts">
	import { NuxtLayout } from "#components";

	const props = defineProps({
		error: {
			type: Object,
			required: true,
		},
	});

	const INSTANCE = useInstanceStore();
	const USER = useUserStore();
	const route = useRoute();
	const { indexable } = useRuntimeConfig().public;

	const errorMessage = computed<string>(() => {
		if (!INSTANCE.current?.id) return props.error.message;

		switch (props.error.statusCode) {
			case 404:
				return "La página que buscas esta errada o no existe";
			case 500:
			case 503:
				return "Error interno del servidor";
			default:
				return props.error.message;
		}
	});

	// lifecycle
	useHead(() => {
		const newMeta: Record<string, any> = {
			title: `Error ${props.error.statusCode} ⋅ ${INSTANCE.current?.name || "NO DB"}`,
		};

		if (!indexable || !!route.meta.noindex) {
			newMeta.meta = [{ name: "robots", content: "noindex, nofollow" }];
		}

		return newMeta;
	});
</script>
