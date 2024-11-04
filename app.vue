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
								class="flx --flxColumn --flx-center --gap-30 --pTop-50 --width-100 --minHeight-100"
							>
								<div
									class="x-navigation flx --flxRow-wrap --flx-between-center --width-100"
								>
									<div class="">
										<XamuActionLink
											v-if="SESSION.user && route.path != '/cursos'"
											@click="$router.back()"
										>
											<XamuIconFa name="chevron-left" />
											<span>Volver</span>
										</XamuActionLink>
									</div>
									<div class="flx --flxRow --flx-end-center --gap-30">
										<XamuActionLink
											tooltip="Síguenos para estar al tanto de las novedades"
											href="https://www.instagram.com/cuna_proyecto/"
										>
											<span class="x-uncapitalize">cuna_proyecto</span>
											<XamuIconFa name="instagram" :size="20" brand />
										</XamuActionLink>
										<XamuDropdown
											v-if="SESSION.user"
											:position="['bottom', 'right']"
											invert-theme
										>
											<template #toggle="{ setModel, model }">
												<XamuActionLink
													aria-label="Ver opciones de usuario"
													tooltip="Ver opciones de usuario"
													tooltip-as-text
													tooltip-position="bottom"
													:active="model"
													:size="eSizes.LG"
													@click="setModel()"
												>
													<span class="--hidden:xs-inv">
														{{ SESSION.userName || "Sin nombre" }}
													</span>
													<figure
														v-if="SESSION.user.photoURL"
														class="avatar --size-sm --bdr"
													>
														<XamuBaseImg
															:src="SESSION.user.photoURL"
															:alt="`Foto de perfil ${SESSION.userName || 'Sin nombre'}`"
														/>
													</figure>
													<XamuIconFa indicator name="chevron-down" />
												</XamuActionLink>
											</template>
											<template #default="{ setModel }">
												<nav
													class="list flx --flxColumn --gap-20 --minWidth-max --txtColor"
												>
													<ul class="list-group --gap-5">
														<li>
															<p class="--txtSize-xs">
																Cuenta ⋅ {{ SESSION.user.email }}
															</p>
														</li>
														<li>
															<XamuActionLink to="/cuenta">
																<XamuIconFa name="circle-user" />
																<span>Mi perfil</span>
															</XamuActionLink>
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
															<XamuActionButton
																class="--width-100"
																:theme="eColors.DANGER"
																@click="
																	setModel(false);
																	SESSION.logout();
																"
															>
																<XamuIconFa name="power-off" />
																<span>Cerrar sesion</span>
															</XamuActionButton>
														</li>
													</ul>
												</nav>
											</template>
										</XamuDropdown>
									</div>
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
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const route = useRoute();
	const { indexable } = useRuntimeConfig().public;

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
				min-height: calc(100vh - 4rem);
				min-height: calc(100dvh - 4rem);
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
			height: 4rem;
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
		.x-uncapitalize::first-letter {
			text-transform: none;
		}
	}
</style>
