<template>
	<div ref="layoutRef" class="x-layout scrollable">
		<div class="x-main --bgColor-light">
			<header
				v-if="INSTANCE.current?.banner?.message"
				class="x-main-banner flx --flxColumn --flx-center --gap-0 --width-100 --bgColor-secondary"
			>
				<div
					class="flx --flx-center --flx --txtColor-light --txtSize-xs --txtSize-sm:md --pX --maxWidth-100"
				>
					<XamuActionLink
						v-if="INSTANCE.current?.banner?.url"
						:to="INSTANCE.current.banner.url"
						:theme="eColors.LIGHT"
						class="--display-block"
					>
						<span class="--txtWrap">{{ INSTANCE.current.banner.message }}</span>
					</XamuActionLink>
					<p v-else class="--txtAlign-center">{{ INSTANCE.current.banner.message }}</p>
				</div>
			</header>
			<nav class="x-main-nav">
				<ul
					class="holder flx --flxRow --flx-between-center --gap-10 --gap:sm --gap-30:md --height-100"
				>
					<li>
						<ul class="flx --flxRow --flx-start-center --gap-10 --gap:sm --gap-30:md">
							<li>
								<XamuActionLink to="/" tooltip="Inicio">
									<XamuIconFa name="chess-knight" :size="35" />
								</XamuActionLink>
							</li>
							<li>
								<XamuActionButtonLink
									to="/cursos"
									tooltip="Ir a las cursos"
									round=":sm-inv"
									as-toggle
								>
									<XamuIconFa name="book" class="" />
									<XamuIconFa name="book" class="--hidden-full:md" />
									<span class="--hidden-full:sm-inv">Cursos</span>
								</XamuActionButtonLink>
							</li>
							<li>
								<XamuActionButtonLink
									to="/notas"
									tooltip="Ir a las notas"
									round=":sm-inv"
									as-toggle
								>
									<XamuIconFa name="layer-group" class="" />
									<XamuIconFa name="layer-group" class="--hidden-full:md" />
									<span class="--hidden-full:sm-inv">Notas</span>
								</XamuActionButtonLink>
							</li>
						</ul>
					</li>
					<li>
						<ul class="flx --flxRow --flx-end-center --gap-10 --gap:sm --gap-30:md">
							<li
								v-if="INSTANCE.current?.instagramId"
								:class="{ '--hidden-full:sm-inv': USER.canModerate }"
							>
								<XamuActionLink
									tooltip="Síguenos para estar al tanto de las novedades"
									:href="`https://www.instagram.com/${INSTANCE.current.instagramId}/`"
								>
									<XamuIconFa
										name="instagram"
										brand
										:size="25"
										class="--hidden-full:md"
									/>
									<XamuIconFa
										name="instagram"
										brand
										:size="20"
										class="--hidden-full:md-inv"
									/>
									<span class="x-uncapitalize --hidden-full:md-inv">
										{{ INSTANCE.current.instagramId }}
									</span>
								</XamuActionLink>
							</li>
							<li v-if="!USER.user">
								<XamuActionButtonLink
									to="/ingresar"
									tooltip="Ir a la iniciar sesion"
									round=":sm-inv"
									as-toggle
								>
									<XamuIconFa name="user-circle" class="" />
									<XamuIconFa name="user-circle" class="--hidden-full:md" />
									<span class="--hidden-full:sm-inv">Iniciar sesión</span>
								</XamuActionButtonLink>
							</li>
							<template v-else>
								<li v-if="CUNA.queue.length">
									<DropdownQueue v-slot="{ setModel }">
										<li>
											<XamuActionButtonToggle
												:round="!CUNA.activeQueue.length"
												tooltip="Ver tareas"
												tooltip-position="left"
												@click="setModel()"
											>
												<XamuIconFa name="list-check" />
												<XamuIconFa name="list-check" />
												<span v-if="CUNA.activeQueue.length">
													Procesando...
												</span>
											</XamuActionButtonToggle>
										</li>
									</DropdownQueue>
								</li>
								<li v-if="USER.token && enrolledCount">
									<DropdownEnrollment
										v-slot="{ setModel, model }"
										v-bind="{ enrolledCount }"
									>
										<XamuActionButtonToggle
											tooltip="Ver mi horario"
											:active="model"
											@click="setModel()"
										>
											<XamuIconFa name="book" />
											<XamuIconFa name="book" />
											<span>{{ enrolledCount }}</span>
										</XamuActionButtonToggle>
									</DropdownEnrollment>
								</li>
								<li>
									<DropdownUser v-slot="{ setModel, model }">
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
												{{ USER.userName || "Sin nombre" }}
											</span>
											<figure
												v-if="USER.user?.photoURL"
												class="avatar --size-sm --bdr"
											>
												<XamuBaseImg
													:src="USER.user.photoURL"
													:alt="`Foto de perfil ${USER.userName || 'Sin nombre'}`"
												/>
											</figure>
											<XamuIconFa indicator name="chevron-down" />
										</XamuActionLink>
									</DropdownUser>
								</li>
								<li v-if="USER.canDevelop">
									<DropdownAdmin v-slot="{ setModel, model }">
										<li>
											<XamuActionLink
												tooltip="Panel de control"
												tooltip-as-text
												tooltip-position="bottom"
												@click="setModel()"
											>
												<XamuActionButtonToggle :active="model" round>
													<XamuIconFa name="star-of-life" />
													<XamuIconFa name="star-of-life" regular />
												</XamuActionButtonToggle>
												<XamuIconFa indicator name="chevron-down" />
											</XamuActionLink>
										</li>
									</DropdownAdmin>
								</li>
							</template>
						</ul>
					</li>
				</ul>
			</nav>
			<main class="x-main-inner">
				<div v-if="CUNA.maintenance && !USER.canModerate && !isLoginPage" class="view">
					<div class="view-item --flx-center --minHeightVh-100 --bgColor-light">
						<div class="holder flx --flxColumn --flx-center">
							<div class="txt --txtAlign-center --width-100">
								<h2>Disculpa las molestias :(</h2>
								<p>{{ CUNA.maintenance }}</p>
							</div>
						</div>
					</div>
				</div>
				<slot v-else></slot>
			</main>
		</div>
		<footer class="x-footer --txtColor-secondary">
			<div class="x-footer-by flx --flxRow --flx-center">
				<div class="holder flx --flxRow --flx-center">
					<div class="txt --txtSize-xs --txtAlign-center">
						<p>
							Made with ❤️ by
							<a href="https://github.com/vis97c" target="_blank">V.</a>
							©{{ new Date().getFullYear() }}, All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	/**
	 * Default layout
	 *
	 * @layout admin layer
	 */

	const CUNA = useCunaStore();
	const INSTANCE = useInstanceStore();
	const USER = useUserStore();
	const route = useRoute();

	const enrolledCount = computed(() => USER.enrolled.length);
	const isLoginPage = computed(() => route.path === "/ingresar");
</script>

<style lang="scss">
	@media only screen {
		@layer presets {
			body,
			#__nuxt,
			.x-root,
			.x-layout {
				width: 100%;
				height: 100%;
			}
			.view-item.--minHeightVh-100 {
				min-height: calc(100vh - 7.4rem);
				min-height: calc(100dvh - 7.4rem);
			}
			:has(.x-main > .x-main-banner) .view-item.--minHeightVh-100 {
				min-height: calc(100vh - 9.8rem);
				min-height: calc(100dvh - 9.8rem);
			}
		}
	}
</style>

<style lang="scss" scoped>
	@media only screen {
		.x-main {
			width: 100%;
			min-height: calc(100% - 2.4rem);
			border-bottom-left-radius: 2rem;
			border-bottom-right-radius: 2rem;
			box-shadow: 0 -0.5rem 1rem xamu.color(secondary, 0.1);
			overflow: hidden;
			margin-bottom: 2.4rem;
			z-index: 1;
			.x-main-banner {
				height: 2.4rem;
				z-index: 1;
			}
			.x-main-nav {
				height: 5rem;
				z-index: 2;
				border-bottom: 2px solid xamu.color(secondary, 0.1);
			}
			.x-main-banner,
			.x-main-nav {
				width: 100%;
			}
		}
		.x-footer {
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			overflow: visible;

			.x-footer-content {
				height: 11rem;
				padding: 2.4rem 0;
				border-bottom: 2px solid xamu.color(secondary, 0.1);
			}
			.x-footer-by {
				height: 2.4rem;
			}
			.x-footer-content,
			.x-footer-by {
				width: 100%;
				box-sizing: border-box;
			}
		}
		.x-layout {
			overflow: hidden auto;
			transition: background 0.5s ease;
		}
	}
</style>
