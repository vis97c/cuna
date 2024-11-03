<template>
	<section
		id="account"
		key="account"
		class="flx --flxColumn --flx-start-center --gap-30 --width-100"
	>
		<div class="txt --gap-10 --width-100">
			<h2>{{ SESSION.userName || "Sin nombre" }}</h2>
		</div>
		<div class="txt --gap-10 --width-100">
			<div class="txt --gap-0">
				<h4>Información personal:</h4>
				<p class="--txtSize-xs">
					Datos proporcionados por Google a partir del correo institucional.
				</p>
			</div>
			<p>Nombre completo: {{ SESSION.user?.name }}</p>
			<p>Correo institucional: {{ SESSION.user?.email }}</p>
		</div>
		<div class="txt --gap-10 --width-100">
			<div class="txt --gap-0">
				<h4>Eliminar mi cuenta de Cuna:</h4>
				<p class="--txtSize-xs">
					Considera ponerte en contacto con Cuna si presentas dudas o problemas.
				</p>
			</div>
			<XamuActionButton :theme="eColors.DANGER" @click="SESSION.remove">
				<XamuIconFa name="power-off" />
				<span>Eliminar cuenta</span>
			</XamuActionButton>
		</div>
		<div class="txt --gap-10 --width-100">
			<h4>Tratamiento de datos:</h4>
			<p>
				Cuna se limita a manejar un numero limitado de tus datos personales (nombre, correo
				y foto de perfil).
			</p>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Account page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Cuenta",
		title: "Cuenta",
		middleware: ["auth-only"],
	});

	const SESSION = useSessionStore();
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>
