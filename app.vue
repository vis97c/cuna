<template>
	<div class="x-layout">
		<NuxtLoadingIndicator class="x-layout-loader" :duration="5000" color="#0f47af" />
		<div v-if="APP.instance?.config?.maintenanceMessage && !SESSION.canDevelop" class="view">
			<div class="view-item --flx-center --minHeightVh-100 --pY-30">
				<div class="txt --txtAlign-center --width-100">
					<h2>Disculpa las molestias :(</h2>
					<p>{{ APP.instance.config.maintenanceMessage }}</p>
				</div>
			</div>
		</div>
		<div v-else class="flx --flxColumn --flx-start-stretch --gap-0">
			<div
				v-if="!isAdmin && SESSION.user && APP.instance?.banner?.message"
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
											<XamuActionLink
												v-if="SESSION.user && route.path != '/cursos'"
												to="/cursos"
											>
												<XamuIconFa name="chevron-left" />
												<span class="--hidden:sm-inv">Volver</span>
											</XamuActionLink>
										</li>
										<XamuDropdown
											v-if="enrolledCount"
											:position="['bottom', 'left']"
											invert-theme
										>
											<template #toggle="{ setModel, model }">
												<li>
													<XamuActionButtonToggle
														tooltip="Ver mi horario"
														:active="model"
														@click="setModel()"
													>
														<XamuIconFa name="book" />
														<XamuIconFa name="book" />
														<span>{{ enrolledCount }}</span>
													</XamuActionButtonToggle>
												</li>
											</template>
											<template #default>
												<div
													class="flx --flxColumn --flx-start --gap-10 --txtColor"
												>
													<div class="txt --gap-5">
														<p class="--txtSize-xs">Cursos inscritos</p>
														<h4>Mi horario académico</h4>
													</div>
													<div class="--pX-5 --width-100">
														<hr />
													</div>
													<Week
														:enrolled-groups="
															Object.values(SESSION.enrolled)
														"
													/>
												</div>
											</template>
										</XamuDropdown>
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
										<template v-if="SESSION.user">
											<XamuDropdown
												:position="['bottom', 'right']"
												invert-theme
											>
												<template #toggle="{ setModel, model }">
													<li>
														<XamuActionLink
															aria-label="Ver opciones de usuario"
															tooltip="Ver opciones de usuario"
															tooltip-as-text
															tooltip-position="bottom"
															:active="model"
															:size="eSizes.LG"
															@click="setModel()"
														>
															<span class="--hidden:sm-inv">
																{{
																	SESSION.userName || "Sin nombre"
																}}
															</span>
															<figure
																v-if="SESSION.user?.photoURL"
																class="avatar --size-sm --bdr"
															>
																<XamuBaseImg
																	:src="SESSION.user.photoURL"
																	:alt="`Foto de perfil ${SESSION.userName || 'Sin nombre'}`"
																/>
															</figure>
															<XamuIconFa
																indicator
																name="chevron-down"
															/>
														</XamuActionLink>
													</li>
												</template>
												<template #default="{ setModel }">
													<nav
														class="list flx --flxColumn --gap-20 --minWidth-max --txtColor"
													>
														<ul class="list-group --gap-5">
															<li>
																<p class="--txtSize-xs">
																	Cuenta ⋅
																	{{ SESSION.user?.email }}
																</p>
															</li>
															<li>
																<XamuActionLink to="/cuenta">
																	<XamuIconFa
																		name="circle-user"
																	/>
																	<span>Mi perfil</span>
																</XamuActionLink>
															</li>
															<hr />
															<li>
																<p class="--txtSize-xs">Buscador</p>
															</li>
															<li>
																<XamuSelect
																	v-model="selectedLevel"
																	:options="levels"
																	class="--txtAlign-center"
																/>
															</li>
															<li>
																<XamuSelect
																	v-model="selectedPlace"
																	:options="places"
																	class="--txtAlign-center"
																/>
															</li>
															<li
																class="flx --flxColumn --flx-start --gap-5"
															>
																<XamuInputToggle
																	v-model="withNonRegular"
																	label="Incluir cupos PAES y PEAMA"
																/>
																<p
																	class="--txtSize-xs --maxWidth-220"
																>
																	Si perteneces a los programas de
																	admisión
																	<a
																		href="https://pregrado.unal.edu.co/paes"
																		title="Programa de admisión especial"
																		target="_blank"
																	>
																		PAES
																	</a>
																	o
																	<a
																		href="https://pregrado.unal.edu.co/peama"
																		title="Programa de admisión especial y movilidad académica"
																		target="_blank"
																	>
																		PEAMA,
																	</a>
																	habilita esta opción para que
																	Cuna te muestre los grupos
																	(Según disponibilidad) con cupos
																	exclusivos para estos programas.
																</p>
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
											<XamuDropdown
												v-if="SESSION.canAdmin"
												:position="['bottom', 'right']"
												invert-theme
											>
												<template #toggle="{ setModel, model }">
													<li>
														<XamuActionLink
															tooltip="Panel de control"
															tooltip-as-text
															tooltip-position="bottom"
															@click="setModel()"
														>
															<XamuActionButtonToggle
																:active="model"
																round
															>
																<XamuIconFa name="star-of-life" />
																<XamuIconFa
																	name="star-of-life"
																	regular
																/>
															</XamuActionButtonToggle>
															<XamuIconFa
																indicator
																name="chevron-down"
															/>
														</XamuActionLink>
													</li>
												</template>
												<template #default="{ invertedTheme }">
													<nav
														v-if="SESSION.canDevelop || SESSION.user"
														class="list flx --flxColumn --gap-20 --minWidth-180 --maxWidth-100 --txtColor"
													>
														<ul
															v-if="SESSION.canDevelop"
															class="list-group --gap-5"
														>
															<li>
																<p class="--txtSize-xs">Cuna</p>
															</li>
															<li>
																<XamuActionLink
																	:theme="invertedTheme"
																	to="/administrar"
																>
																	<XamuIconFa
																		name="star-of-life"
																	/>
																	<span>Panel de control</span>
																</XamuActionLink>
															</li>
															<hr />
															<li>
																<p class="--txtSize-xs">
																	Administrar
																</p>
															</li>
															<li>
																<XamuActionLink
																	:theme="invertedTheme"
																	to="/administrar/registros"
																>
																	<XamuIconFa
																		name="clock-rotate-left"
																	/>
																	<span>Registros</span>
																</XamuActionLink>
															</li>
															<li>
																<XamuActionLink
																	:theme="invertedTheme"
																	to="/administrar/ajustes"
																>
																	<XamuIconFa name="cog" />
																	<span>Ajustes</span>
																</XamuActionLink>
															</li>
															<hr />
															<li>
																<XamuActionLink
																	:theme="invertedTheme"
																	@click="toggleLoadedClass"
																>
																	<XamuIconFa
																		name="flag-checkered"
																	/>
																	<span>Toggle loaded class</span>
																</XamuActionLink>
															</li>
														</ul>
													</nav>
												</template>
											</XamuDropdown>
										</template>
										<li v-else-if="route.path != '/'">
											<XamuActionLink to="/">
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
								<div v-if="!isAdmin" class="txt --txtAlign-center --gap-0">
									<h1 class="--txtSize-mx:md --txtLineHeight-sm">
										<XamuActionLink to="/" class="no--override no--route --gap">
											<XamuIconFa name="chess-knight" :size="10" />
											<span>Cuna</span>
										</XamuActionLink>
									</h1>
									<div class="flx --flxColumn --flx-center --gap-5">
										<div class="flx --flxRow --flx-center --gap-10">
											<p class="--txtColor-dark5">Visor de cursos UNAL</p>
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
											class="flx --flxRow --flx-center --gap-10 --txtSize-xs --txtColor-dark5"
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
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import { eSIALevel } from "./functions/src/types/SIA";

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const route = useRoute();
	const { indexable, countriesUrl } = useRuntimeConfig().public;

	const { levels, places } = useCourseProgramOptions([eSIALevel.PREGRADO, SESSION.place], true);

	const withNonRegular = computed({
		get: () => SESSION.withNonRegular,
		set: (value) => {
			SESSION.toggleNonRegular(value);
		},
	});
	const selectedLevel = computed({
		get: () => SESSION.level,
		set: (value) => {
			SESSION.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => SESSION.place,
		set: (value) => {
			SESSION.setPlace(value);
		},
	});
	const enrolledCount = computed(() => Object.keys(SESSION.enrolled).length);
	const isAdmin = computed(() => route.path.startsWith("/administrar"));

	function toggleLoadedClass() {
		document.body.classList.remove("is--loaded");

		setTimeout(() => {
			document.body.classList.add("is--loaded");
		}, 3000);
	}

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
