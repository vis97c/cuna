<template>
	<XamuBaseErrorBoundary at="App">
		<template #fallback="{ errors }">
			<div class="view">
				<section class="view-item --flx-center --minHeightVh-100 --bgColor-none">
					<XamuBoxMessage :theme="eColors.DANGER">
						<div class="flx --flxRow --flx-center">
							<span>
								APP_ERROR:
								{{ errors?.message || "Error de la aplicación" }}
							</span>
						</div>
					</XamuBoxMessage>
				</section>
			</div>
		</template>
		<main class="x-root">
			<XamuBaseErrorBoundary at="App:Layout">
				<template #fallback="{ errors }">
					<div class="view">
						<section class="view-item --flx-center --minHeightVh-100 --bgColor-none">
							<XamuBoxMessage :theme="eColors.DANGER">
								<div class="flx --flxRow --flx-center">
									<span>
										LAYOUT_ERROR:
										{{ errors?.message || "Error de la plantilla" }}
									</span>
								</div>
							</XamuBoxMessage>
						</section>
					</div>
				</template>
				<NuxtLayout v-slot="layoutSlots" key="app-layout">
					<XamuBaseErrorBoundary at="App:Layout:Page">
						<template #fallback="{ errors }">
							<div class="view">
								<section
									class="view-item --flx-center --minHeightVh-100 --bgColor-none"
								>
									<XamuBoxMessage :theme="eColors.DANGER">
										<div class="flx --flxRow --flx-center">
											<span>
												PAGE_ERROR:
												{{ errors?.message || "Error de la página" }}
											</span>
										</div>
									</XamuBoxMessage>
								</section>
							</div>
						</template>
						<NuxtPage v-bind="layoutSlots" />
					</XamuBaseErrorBoundary>
				</NuxtLayout>
			</XamuBaseErrorBoundary>
			<NuxtLoadingIndicator
				class="x-root-indicators"
				:throttle="200"
				:duration="5000"
				color="rgb(var(--rgb-primary))"
			/>
		</main>
	</XamuBaseErrorBoundary>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	const INSTANCE = useInstanceStore();
	const route = useRoute();
	const { indexable } = useRuntimeConfig().public;

	// lifecycle
	useHead(() => {
		const { hostname } = new URL(INSTANCE.current?.url || "https://cuna.com.co");
		const title = `Cuna ⋅ ${route.meta.title || "Visor de cupos UNAL"}`;
		const base = `https://${hostname}`;
		const url = `${base}/${route.path}`;
		const image = `${base}/${route.meta.image || "/images/seo.jpg"}`;
		let description = INSTANCE.current?.description || "";
		let keywords = INSTANCE.current?.keywords || [];

		if (typeof route.meta.description === "string") description = route.meta.description;
		if (Array.isArray(route.meta.keywords)) keywords = route.meta.keywords;

		const keywordsString = keywords.join(", ");
		const meta: Record<string, string>[] = [
			// Default meta
			{ name: "description", content: description },
			{ name: "keywords", content: keywordsString },
			// Open Graph
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:image", content: image },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: url },
			{ property: "og:site_name", content: "Cuna" },
			// Twitter/X
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: image },
		];
		const link: Record<string, string>[] = [
			// Canonical
			{ rel: "canonical", href: url },
		];

		if (!indexable || !!route.meta.noindex) {
			meta.push({ name: "robots", content: "noindex, nofollow" });
		}

		return { title, meta, link };
	});
</script>

<style lang="scss">
	// Default Firebase Store styles
	// These are intended to be overriden
	@media only screen {
		// SweetAlert2 overrides, layers are not supported
		.swal2-actions {
			gap: 1rem;
		}
		.swal2-popup {
			color: xamu.color(dark);
			border-radius: 1rem;
			&.swal2-toast {
				box-shadow: 3px 3px 9px xamu.color(secondary, 0.1);
				.swal2-title {
					margin-top: 0;
				}
				.swal2-html-container {
					margin-top: 0;
					margin-bottom: 0;
					font-size: xamu.size(sm);
				}
			}
		}
		.swal2-footer {
			white-space: normal;
		}
		.swal2-backdrop-show {
			// Same as modal backdrop
			background: xamu.color(dark, 0.1);
		}

		// Default styling
		@layer presets {
			* {
				transition: all 0.3s ease;
			}
			h1,
			h2,
			h3,
			h4,
			h5,
			h6 {
				a,
				button,
				label {
					font-style: inherit;
					font-weight: inherit;
					white-space: normal;
				}
			}
			.layout-enter-active,
			.layout-leave-active,
			.page-enter-active,
			.page-leave-active {
				transition: all 0.4s;
			}
			.page-enter-from,
			.page-leave-to {
				opacity: 0;
				filter: blur(1rem);
			}
			.layout-enter-from,
			.layout-leave-to {
				filter: grayscale(1);
			}
			.txt {
				a,
				b,
				th,
				button,
				strong {
					font-family: inherit;
				}
			}
			.view-item {
				padding: 2.4rem 0;
				box-sizing: border-box;
				transition: all 0.5s ease-out;
			}
			.dropdown:not(:has(> .dropdown-item)),
			.dropdown > .dropdown-item {
				box-shadow: 3px 3px 9px xamu.color(secondary, 0.1);
			}
			.modal {
				box-shadow: 3px 3px 9px xamu.color(secondary, 0.1);
			}
			.ellipsis {
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.x-root-queue .bttnToggle::after {
				content: "";
				height: 100%;
				width: 100%;
				position: absolute;
				top: 0;
				left: 0;
				z-index: -1;
				border-radius: inherit;
				background: xamu.color(light);
				box-shadow: 3px 3px 9px xamu.color(secondary, 0.1);
			}
		}
	}
	@media only screen and (any-pointer: coarse) {
		@layer presets {
			.scroll::-webkit-scrollbar-thumb {
				background-color: xamu.color(dark, 0.3);
			}
		}
	}
</style>

<style lang="scss" scoped>
	@media only screen {
		@layer presets {
			.x-root {
				width: 100%;
				height: 100%;
				overflow: hidden;
			}
			.x-root-indicators {
				width: 100%;
			}
			.x-root-queue {
				position: fixed;
				bottom: 2rem;
				right: 2rem;
				z-index: 1000;
			}
		}
	}
</style>
