<template>
	<section id="admin-store" class="flx --flxColumn --flx-start --gap-30">
		<div class="grd --grdColumns-auto2:md --flx-start-center">
			<div class="txt">
				<div>
					<h3>{{ appName }}</h3>
					<h2>Panel de control</h2>
				</div>
				<p>Accede fácilmente a la configuración e información de {{ appName }}.</p>
			</div>
			<div
				class="--pLeft-50:md flx --flxRow --flx-start-center --height-100 --hidden-full:md-inv"
			>
				<div class="--pLeft-50:md txt --txtColor-dark5">
					<div>
						<h3 class="--txtColor-light">Saludos</h3>
						<h2>{{ greetUser() }}</h2>
					</div>
					<p>¡Nos encanta tenerte devuelta!</p>
				</div>
			</div>
		</div>
		<div id="main-scroll" class="scroll --pY-5">
			<div
				class="flx --flxColumn --flxRow:md --flx-start-stretch --width-max:md --minWidth-100"
			>
				<div class="flx --flxColumn --flx-start --maxWidth-100:md">
					<div class="flx --flxColumn --flx-start --gap-none --txtColor">
						<h4>SaaS</h4>
						<p class="--txtSize-xs">Visitar seccion</p>
					</div>
					<div class="scroll --horizontal --always">
						<div class="flx --flxRow --flx-start --width-max --minWidth-100">
							<XamuBoxAction
								to="/administrar/instancias"
								icon="store"
								label="Instancias"
							/>
							<XamuBoxAction
								to="/administrar/cursos"
								icon="building-columns"
								label="Cursos"
							/>
							<XamuBoxAction
								to="/administrar/usuarios"
								icon="users"
								label="Usuarios"
							/>
							<XamuBoxAction to="/administrar/ajustes" icon="cog" label="Ajustes" />
						</div>
					</div>
				</div>
				<hr class="--vertical:md" />
				<div class="flx --flxColumn --flx-start --maxWidth-100:md">
					<div class="flx --flxColumn --flx-start --gap-none --txtColor">
						<h4>Seguimiento</h4>
						<p class="--txtSize-xs">Visitar seccion</p>
					</div>
					<div class="scroll --horizontal --always">
						<div class="flx --flxRow --flx-start --width-max --minWidth-100">
							<XamuBoxAction
								to="/administrar/registros?global=1"
								icon="clock-rotate-left"
								label="Registros"
							/>
							<XamuBoxAction
								to="/administrar/registros/ofensores"
								icon="skull"
								label="Ofensores"
							/>
						</div>
					</div>
				</div>
				<hr class="--vertical:md" />
				<div class="flx --flxColumn --flx-start --maxWidth-100:md">
					<div class="flx --flxColumn --flx-start --gap-none --txtColor">
						<h4>Desarrollo</h4>
						<p class="--txtSize-xs">Modificar sistema</p>
					</div>
					<div class="scroll --horizontal --always">
						<div class="flx --flxRow --flx-start --width-max --minWidth-100">
							<XamuBoxAction
								:theme="[eColors.SECONDARY_COMPLEMENT, eColors.LIGHT]"
								to="https://github.com/vis97c/cuna"
								target="_blank"
								icon="github"
								:icon-props="{ brand: true, size: 35 }"
								label="GitHub"
							/>
							<XamuBoxAction
								:theme="[eColors.PRIMARY, eColors.LIGHT]"
								:to="`https://console.firebase.google.com/project/${firebaseConfig.projectId}/overview`"
								target="_blank"
								icon="fire"
								label="Firebase"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Admin root page
	 *
	 * @page admin-layer
	 */
	definePageMeta({ title: "Administrar" });

	const USER = useUserStore();
	const { firebaseConfig, appName } = useRuntimeConfig().public;

	function greetUser() {
		const currentHour = new Date().getHours();

		// 18:00 to 06:00
		if (currentHour >= 18 || currentHour < 6) return `Buenas noches ${USER.userName}`;

		return `Buen dia ${USER.userName}`;
	}
</script>

<style scoped lang="scss">
	@media only screen {
		@layer presets {
			#main-scroll {
				width: 100%;

				@media (width > xamu.$querie-tablet) {
					max-height: 100%;
					overflow: auto hidden;
					box-sizing: content-box;

					@media (max-width: 87.5rem) {
						&:has(:only-child) {
							width: calc(min(100%, 100vw) + 4rem);
							margin: 0 -2rem;

							> :only-child {
								border-right: 2rem solid transparent;
								border-left: 2rem solid transparent;
							}
						}
					}
				}
			}
		}
	}
</style>
