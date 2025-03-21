<template>
	<section id="admin-store" class="flx --flxColumn --flx-start --gap-30">
		<div class="grd --grdColumns-auto2:md">
			<div class="txt">
				<div>
					<h2>Panel de control</h2>
					<p>Accede fácilmente a la configuración de Cuna.</p>
				</div>
			</div>
			<div
				v-if="SESSION.user?.name"
				class="flx --flxRow --flx-start-end --height-100 --hidden-full:md-inv"
			>
				<div class="txt">
					<div class="">
						<h2>{{ greetUser() }}</h2>
						<p>¡Nos encanta tenerte devuelta!</p>
					</div>
				</div>
			</div>
		</div>
		<div class="flx --flxColumn --flxRow:md --flx-start-stretch --width-100">
			<div class="flx --flxColumn --flx-start">
				<div class="flx --flxColumn --flx-start --gap-none --txtColor">
					<h4>Cuna</h4>
					<p class="--txtSize-xs">Visitar seccion</p>
				</div>
				<div class="scroll --horizontal">
					<div class="flx --flxRow-wrap --flx-start">
						<XamuBoxAction
							to="/administrar/registros"
							icon="clock-rotate-left"
							label="Registros"
						/>
						<XamuBoxAction
							to="/administrar/cursos"
							icon="clock-rotate-left"
							label="Cursos"
						/>
						<XamuBoxAction to="/administrar/ajustes" icon="cog" label="Ajustes" />
					</div>
				</div>
			</div>
			<!-- <hr class="--vertical:md" />
			<div class="flx --flxColumn --flx-start">
				<div class="flx --flxColumn --flx-start --gap-none --txtColor">
					<h4>Primeros pasos</h4>
					<p class="--txtSize-xs">Configura los pagos</p>
				</div>
				<div class="scroll --horizontal">
					<div class="flx --flxRow-wrap --flx-start">
						<XamuBoxAction
							to="/administrar/ajustes#pagos"
							icon="dollar-sign"
							label="Pagos"
						/>
					</div>
				</div>
			</div> -->
		</div>
	</section>
</template>

<script setup lang="ts">
	/**
	 * Developer logs page
	 *
	 * @page
	 */
	definePageMeta({ title: "Administrar" });

	const SESSION = useSessionStore();

	function greetUser() {
		const currentHour = new Date().getHours();
		const name = SESSION.user?.name?.split(" ")[0];

		// 18:00 to 06:00
		if (currentHour >= 18 || currentHour < 6) return `Buenas noches ${name}`;

		return `Buen dia ${name}`;
	}
</script>
