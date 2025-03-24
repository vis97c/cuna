<template>
	<div class="x-layout">
		<NuxtLoadingIndicator class="x-layout-loader" :duration="5000" color="#0f47af" />
		<div v-if="APP.maintenance" class="view">
			<div class="view-item --flx-center --minHeightVh-100 --pY-30">
				<div class="txt --txtAlign-center --width-100">
					<h2>Disculpa las molestias :(</h2>
					<p>{{ APP.maintenance }}</p>
				</div>
			</div>
		</div>
		<div v-else class="flx --flxColumn --flx-start-stretch --gap-0">
			<div
				v-if="SESSION.token && !isAdmin && APP.instance?.banner?.message"
				class="x-banner flx --flxColumn --flx-center --gap-0 --width-100 --maxWidth --mX"
			>
				<div
					class="flx --flx-center --flx --txtColor-secondary --txtSize-sm --txtSize:md --pX"
				>
					<XamuActionLink
						v-if="APP.instance?.banner?.url"
						:to="APP.instance.banner.url"
						:theme="eColors.SECONDARY"
					>
						<span class="--txtWrap">{{ APP.instance.banner.message }}</span>
					</XamuActionLink>
					<p v-else class="--txtAlign-center">{{ APP.instance.banner.message }}</p>
				</div>
			</div>
			<main class="x-main">
				<div id="landing" class="view">
					<section class="view-item --minHeightVh-100 --pY-30">
						<div class="holder flx --flxColumn --flx-center --gap-30">
							<div
								class="flx --flxColumn --flx-center --gap-30 --pTop-50 --width-100 --minHeight-100"
							>
								<div
									class="x-navigation flx --flxRow --flx-between-center --width-100"
								>
									<ul class="flx --flxRow --flx-start-center --gap-30:sm">
										<li>
											<XamuActionLink v-if="route.path != '/'" to="/">
												<XamuIconFa name="chevron-left" />
												<span class="--hidden:sm-inv">Volver</span>
											</XamuActionLink>
										</li>
										<DropdownEnrollment />
									</ul>
									<ul class="flx --flxRow --flx-end-center --gap-30:sm">
										<li>
											<XamuActionLink
												v-if="APP.instance?.instagramId"
												tooltip="Síguenos para estar al tanto de las novedades"
												:href="`https://www.instagram.com/${APP.instance.instagramId}/`"
											>
												<XamuIconFa name="instagram" :size="20" brand />
												<span class="x-uncapitalize --hidden:xs-inv">
													{{ APP.instance.instagramId }}
												</span>
											</XamuActionLink>
										</li>
										<DropdownUser />
										<DropdownAdmin />
										<li v-if="!SESSION.token && route.path != '/ingresar'">
											<XamuActionLink to="/ingresar">
												<XamuIconFa
													name="circle-user"
													:size="20"
													force-regular
												/>
												<span class="--hidden:xs-inv">Iniciar sesión</span>
											</XamuActionLink>
										</li>
									</ul>
								</div>
								<div
									v-if="!isAdmin"
									class="flx --flxColumn --flx-start-center --gap-20"
								>
									<div class="txt --txtAlign-center --txtColor-dark5 --gap-none">
										<h1 class="--txtSize-mx:md --txtLineHeight-sm">
											<XamuActionLink
												to="/"
												class="no--override no--route --gap"
											>
												<XamuIconFa name="chess-knight" :size="10" />
												<span>Cuna</span>
											</XamuActionLink>
										</h1>
										<div class="flx --flxColumn --flx-center --gap-5">
											<div class="flx --flxRow --flx-center --gap-10">
												<p>Visor de cursos UNAL</p>
												<XamuActionLink
													class="x-info"
													:theme="eColors.DARK"
													tooltip="Cuna no esta afiliada a la UNAL"
													tooltip-as-text
												>
													<XamuIconFa name="circle-info" />
												</XamuActionLink>
											</div>
											<div
												class="flx --flxRow --flx-center --gap-10 --txtSize-xs"
											>
												<template v-if="APP.instance?.config?.version">
													<span>{{ APP.instance.config.version }}</span>
													⋅
												</template>
												<XamuActionLink
													href="https://github.com/vis97c/cuna"
													tooltip="Código fuente. GNU GPL v3"
												>
													<XamuIconFa name="github" brand />
												</XamuActionLink>
											</div>
										</div>
									</div>
									<div
										v-if="APP.SIAMaintenance"
										class="txt --txtAlign-center --gap-10"
									>
										<h4>El SIA se encuentra en mantenimiento</h4>
										<p class="--txtSize-sm --txtColor-dark5">
											Puedes explorar los cursos previamente guardados, pero
											el buscador estará inactivo y los cursos no se
											actualizarán hasta que el mantenimiento termine.
										</p>
										<p
											class="--txtSize-xs --txtColor-dark5"
											:title="
												APP.instance?.config?.siaMaintenanceTillAt?.toString()
											"
										>
											Volveremos a la normalidad {{ SIAMaintenanceTillAt }}.
										</p>
									</div>
									<div
										v-else-if="
											APP.ExplorerV1Maintenance || APP.ExplorerV2Maintenance
										"
										class="txt --txtAlign-center --gap-10"
									>
										<h4>El buscador se encuentra en mantenimiento</h4>
										<p class="--txtSize-sm --txtColor-dark5">
											Puedes explorar los cursos previamente guardados.
										</p>
										<p
											v-if="APP.ExplorerV1Maintenance"
											class="--txtSize-xs --txtColor-dark5"
										>
											Volveremos a la normalidad
											{{ ExplorerV1MaintenanceTillAt }}.
										</p>
										<p v-else class="--txtSize-xs --txtColor-dark5">
											Volveremos a la normalidad
											{{ ExplorerV2MaintenanceTillAt }}.
										</p>
									</div>
									<div
										v-else-if="!SESSION.token && route.path != '/ingresar'"
										class="txt --txtAlign-center --gap-10"
									>
										<h4>Modo lectura</h4>
										<p class="--txtSize-sm --txtColor-dark5">
											Inicia sesión para obtener una experiencia completa con
											búsqueda de cursos e información de cupos actualizada,
											así como otras novedades.
										</p>
									</div>
								</div>
								<div
									id="renderer"
									class="x-renderer flx --flxColumn --flx-center --width-100"
									:class="{ 'is--admin': isAdmin }"
								>
									<NuxtPage />
								</div>
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
	const { indexable, countriesUrl } = useRuntimeConfig().public;

	const isAdmin = computed(() => route.path.startsWith("/administrar"));
	const SIAMaintenanceTillAt = computed(() => {
		const date = new Date(APP.instance?.config?.siaMaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
	const ExplorerV1MaintenanceTillAt = computed(() => {
		const date = new Date(APP.instance?.config?.explorerV1MaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
	const ExplorerV2MaintenanceTillAt = computed(() => {
		const date = new Date(APP.instance?.config?.explorerV2MaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});

	// lifecycle
	useHead(() => {
		const { hostname } = new URL(countriesUrl);
		const title = `Cuna ⋅ ${route.meta.title || "Visor de cupos UNAL"}`;
		const base = `https://${hostname}`;
		const url = `${base}/${route.path}`;
		const image = `${base}/${route.meta.image || "/images/seo.jpg"}`;
		let description = APP.instance?.description || "";
		let keywords = APP.instance?.keywords || [];

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
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-banner {
			a {
				max-width: 100%;
				white-space: normal;
			}
			+ .x-main {
				border-top-left-radius: 0.5rem;
				border-top-right-radius: 0.5rem;
				box-shadow: 0 -0.5rem 1rem rgba(var(--rgb-secondary), 0.1);

				.--minHeightVh-100 {
					min-height: calc(100vh - 3rem);
					min-height: calc(100dvh - 3rem);
				}
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
		}
		.x-main {
			width: 100%;
			// overflow: hidden;
			box-sizing: border-box;
			background: utils.color(light);
		}
		.x-info {
			opacity: 0.7;
			z-index: 9;
		}
		.x-navigation {
			position: absolute;
			top: 0;
			left: 0;
		}
		.x-uncapitalize::first-letter {
			text-transform: none;
		}
		.x-renderer.is--admin {
			flex: 1 1 100%;
		}
	}
</style>
