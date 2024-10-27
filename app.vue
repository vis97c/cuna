<template>
	<div class="x-layout">
		<NuxtLoadingIndicator class="x-layout-loader" :duration="5000" color="#2980b9" />
		<main class="x-main">
			<AppBoundary />
		</main>
	</div>
</template>

<script setup lang="ts">
	const APP = useAppStore();
	const route = useRoute();
	const { indexable } = useRuntimeConfig().public;

	// lifecycle
	useHead(() => {
		const newMeta: Record<string, any> = {
			title: `${route.meta.title || "Cargando..."} ⋅ ${APP.instance?.name || "NO DB"}`,
		};

		if (!indexable || !!route.meta.noindex) {
			newMeta.meta = [{ name: "robots", content: "noindex, nofollow" }];
		}

		return newMeta;
	});
</script>

<style lang="scss" scoped>
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-layout {
			width: 100%;
			transition: background 0.5s ease;

			&-footer {
				// min-height: 20rem;
				padding: 2.4rem 0;
				box-sizing: border-box;
				background-color: utils.color(light);
				border-top: 2px solid utils.color(primary, 0.1);

				span.list-title {
					margin-bottom: 0;
				}
			}
		}
		.x-main {
			width: 100%;
			overflow: hidden;
			box-sizing: border-box;
		}
	}
</style>
