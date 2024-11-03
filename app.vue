<template>
	<div class="x-layout">
		<NuxtLoadingIndicator class="x-layout-loader" :duration="5000" color="#2980b9" />
		<div class="flx --flxColumn --flx-start-stretch --gap-0">
			<div
				v-if="SESSION.user && APP.instance?.banner?.message"
				class="x-banner flx --flxColumn --flx-center --gap-0 --width-100 --maxWidth --mX"
			>
				<hr />
				<div class="flx --flx-center --flx --txtSize-sm --txtColor-dark5 --pX">
					<XamuActionLink v-if="APP.instance?.banner?.url" :to="APP.instance.banner.url">
						{{ APP.instance.banner.message }}
					</XamuActionLink>
					<p v-else class="--txtAlign-center">{{ APP.instance.banner.message }}</p>
				</div>
			</div>
			<main class="x-main">
				<div id="landing" class="view">
					<section class="view-item --minHeightVh-100 --pY-30">
						<div class="holder flx --flxColumn --flx-center --gap-30">
							<div
								class="flx --flxColumn --flx-center --gap-30 --pY-50 --width-100 --minHeight-100"
							>
								<div
									v-if="SESSION.user"
									class="x-navigation flx --flxRow-wrap --flx-between-center --width-100"
								>
									<div class="">
										<XamuActionLink v-if="route.path != '/'" to="/">
											<XamuIconFa name="chevron-left" />
											<span>Volver</span>
										</XamuActionLink>
									</div>
									<XamuDropdown :position="['bottom', 'right']" invert-theme>
										<template #toggle="{ setModel }">
											<XamuActionLink
												aria-label="Ver opciones de usuario"
												tooltip="Ver opciones de usuario"
												tooltip-as-text
												tooltip-position="bottom"
												@click="setModel()"
											>
												<span>{{ userName || "Sin nombre" }}</span>
												<XamuIconFa indicator name="chevron-down" />
											</XamuActionLink>
										</template>
										<template #default>
											<nav
												class="list flx --flxColumn --gap-20 --minWidth-max --txtColor"
											>
												<ul class="list-group --gap-5">
													<li>
														<p class="--txtSize-xs">Cuenta</p>
													</li>
													<li>
														<p>{{ SESSION.user.email }}</p>
													</li>
													<hr />
													<li>
														<p class="--txtSize-xs">Buscador</p>
													</li>
													<li>
														<XamuInputToggle
															v-model="withNonRegular"
															label="Incluir cupos PAES y PEAMA"
														/>
													</li>
													<hr />
													<li>
														<XamuActionLink
															:theme="eColors.DANGER"
															@click="SESSION.logout"
														>
															<XamuIconFa name="power-off" />
															<span>Cerrar sesion</span>
														</XamuActionLink>
													</li>
												</ul>
											</nav>
										</template>
									</XamuDropdown>
								</div>
								<div class="txt --txtAlign-center --gap-0">
									<h1 class="--txtSize-mx:md --txtLineHeight-sm">
										<XamuActionLink to="/" class="no--override no--route --gap">
											<XamuIconFa name="chess-knight" :size="10" />
											<span>Cuna</span>
										</XamuActionLink>
									</h1>
									<div class="flx --flxRow --flx-center --gap-5">
										<p class="--txtSize-sm --txtColor-dark5">
											Visor de cursos UNAL (Sede Bogotá)
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

	const userName = computed(() => {
		const fullName = (SESSION.user?.name || "").split(" ");
		const [firstName = "Sin Nombre", secondName = "", firstLastName = ""] = fullName;

		return `${firstName} ${firstLastName || secondName}`.trim();
	});
	const withNonRegular = computed({
		get: () => SESSION.withNonRegular,
		set: (value) => {
			SESSION.toggleNonRegular(value);
		},
	});

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
		.x-navigation {
			position: absolute;
			top: 0;
			left: 0;
		}
	}
</style>
