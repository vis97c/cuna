<template>
	<div id="admin-root" class="view">
		<div
			class="view-item --minHeightVh-100 --bgColor-light flx --flxRow --flx-start-stretch --gap-30"
		>
			<div class="holder --minHeight-100">
				<!-- STARTS: Panel alerts -->
				<!-- <XamuBaseBox
					:el="XamuBaseAction"
					:theme="eColors.WARNING"
					to="/administrar/ajustes"
					class="flx --flxColumn --flxRow:sm --flx-start-center --gap-20 --pY --pX-20"
					button
				>
					<XamuIconFa name="exclamation-triangle" :size="30" />
					<div class="txt --txtWrap --txtAlign-center --txtAlign:sm --gap-5">
						<p class="--txtSize-lg --txtWeight-bold">¡Aún no puedes cobrar!</p>
						<p class="--txtWeight-regular">
							Configura las credenciales de tu pasarela de pago para poder cobrar a
							tus clientes.
						</p>
						<p class="--txtSize-sm --txtWeight-regular">
							Encuentra instrucciones sobre cómo configurar tu pasarela de pago en la
							sección de ajustes.
						</p>
					</div>
				</XamuBaseBox> -->
				<!-- ENDS: Panel alerts -->
				<ul class="flx --flxRow-wrap --flx-start-center --gap-10 --gap:md">
					<li>
						<XamuActionButtonToggle
							to="/administrar"
							tooltip="Panel de control"
							tooltip-as-text
							tooltip-position="bottom"
							round
						>
							<XamuIconFa name="star-of-life" />
							<XamuIconFa name="star-of-life" regular />
						</XamuActionButtonToggle>
					</li>
					<li>
						<XamuActionButtonToggle to="/administrar/cursos" round=":sm-inv">
							<XamuIconFa name="book" />
							<XamuIconFa name="book" regular />
							<span class="--hidden-full:sm-inv">Cursos</span>
						</XamuActionButtonToggle>
					</li>
					<li>
						<XamuActionButtonToggle to="/administrar/instancias" round=":sm-inv">
							<XamuIconFa name="store" />
							<XamuIconFa name="store" regular />
							<span class="--hidden-full:sm-inv">Instancias</span>
						</XamuActionButtonToggle>
					</li>
					<li>
						<XamuDropdown
							:theme="[eColors.LIGHT, eColors.SECONDARY]"
							:position="['bottom', 'center']"
						>
							<template #toggle="{ setModel, model }">
								<XamuActionLink @click="setModel()">
									<XamuActionButtonToggle
										tooltip="Ver menu de registros"
										tooltip-as-text
										tooltip-position="bottom"
										:active="model"
										round=":sm-inv"
									>
										<XamuIconFa name="shield" />
										<XamuIconFa name="shield" regular />
										<span class="--hidden-full:sm-inv">Seguimiento</span>
									</XamuActionButtonToggle>
									<XamuIconFa indicator name="chevron-down" />
								</XamuActionLink>
							</template>
							<template #default="{ invertedTheme }">
								<nav
									class="list flx --flxColumn --gap-20 --width-max --maxWidth-100 --txtColor"
								>
									<ul class="list-group --minWidth-90 --maxWidth-220">
										<li>
											<p class="--txtSize-xs --txtTransform-upper">
												Administrar
											</p>
										</li>
										<li>
											<XamuActionLink
												to="/administrar/registros"
												:theme="invertedTheme"
											>
												<XamuIconFa name="clock-rotate-left" />
												<span>Registros</span>
											</XamuActionLink>
										</li>
										<li>
											<XamuActionLink
												to="/administrar/registros/ofensores"
												:theme="invertedTheme"
											>
												<XamuIconFa name="skull" />
												<span>Ofensores</span>
											</XamuActionLink>
										</li>
									</ul>
								</nav>
							</template>
						</XamuDropdown>
					</li>
					<li>
						<XamuActionButtonToggle to="/administrar/usuarios">
							<XamuIconFa name="users" />
							<XamuIconFa name="users" regular />
							<span>Usuarios</span>
						</XamuActionButtonToggle>
					</li>
					<li>
						<XamuActionButtonToggle to="/administrar/ajustes">
							<XamuIconFa name="cog" />
							<XamuIconFa name="cog" regular />
							<span>Ajustes</span>
						</XamuActionButtonToggle>
					</li>
				</ul>
				<div class="flx --flxColumn --flx-center-stretch --flx-fill">
					<NuxtPage />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Admin root
	 *
	 * @root
	 */

	definePageMeta({ middleware: ["auth-only", "can-edit"], noindex: true });
</script>
