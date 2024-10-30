<template>
	<div class="x-layout">
		<NuxtLoadingIndicator class="x-layout-loader" :duration="5000" color="#2980b9" />
		<div class="flx --flxColumn --flx-start-stretch --gap-0">
			<div
				v-if="SESSION.user && APP.instance?.banner?.message"
				class="x-banner flx --flxColumn --flx-center --gap-0 --width-100 --maxWidth --mX"
			>
				<hr />
				<div class="flx --flx-center --flx --txtSize-sm --txtColor-dark5">
					<XamuActionLink v-if="APP.instance?.banner?.url" :to="APP.instance.banner.url">
						{{ APP.instance.banner.message }}
					</XamuActionLink>
					<p v-else class="">{{ APP.instance.banner.message }}</p>
				</div>
			</div>
			<main class="x-main">
				<div id="landing" class="view">
					<section class="view-item --minHeightVh-100 --pY-30">
						<div class="holder flx --flxColumn --flx-center --gap-30">
							<div class="txt --txtAlign-center --gap-0">
								<NuxtLink to="/">
									<h1 class="--txtSize-mx:md --txtLineHeight-sm">Cuna</h1>
								</NuxtLink>
								<div class="flx --flxRow --flx-center --gap-5">
									<p class="--txtSize-sm --txtColor-dark5">
										Visor de cursos UNAL
									</p>
									<XamuActionLink
										class="x-info"
										:theme="eColors.DARK"
										tooltip="Cuna no esta afiliada a la UNAL"
										tooltip-as-text
									>
										<XamuIconFa name="circle-info" />
									</XamuActionLink>
								</div>
							</div>
							<div id="renderer" class="flx --flxColumn --flx-center --width-100">
								<NuxtPage />
							</div>
						</div>
					</section>
				</div>
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	const APP = useAppStore();
	const SESSION = useSessionStore();
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

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-banner {
			+ .x-main .--minHeightVh-100 {
				min-height: calc(100vh - 3rem);
				min-height: calc(100dvh - 3rem);
			}
		}
	}
</style>

<style lang="scss" scoped>
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-layout {
			width: 100%;
			transition: background 0.5s ease;
		}
		.x-banner {
			height: 3rem;
			order: 2;
			// background: utils.color(secondary);
			// border-bottom: 2px dashed utils.color(secondary, 0.1);
		}
		.x-main {
			width: 100%;
			overflow: hidden;
			box-sizing: border-box;
		}
		.x-info {
			opacity: 0.7;
		}
	}
</style>
