<template>
	<div id="account" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder">
				<div class="txt --gap-10 --width-100">
					<h2>{{ USER.userName || "Sin nombre" }}</h2>
				</div>
				<div class="txt --gap-10 --width-100">
					<div class="txt --gap-0">
						<h4>Información personal:</h4>
						<p class="--txtSize-xs">
							Datos proporcionados por Google a partir del correo institucional.
						</p>
					</div>
					<p>Nombre completo: {{ USER.user?.name }}</p>
					<p>Correo institucional: {{ USER.user?.email }}</p>
				</div>
				<div class="txt --gap-10 --width-100">
					<div class="txt --gap-0">
						<h4>Eliminar mi cuenta de Cuna:</h4>
						<p class="--txtSize-xs">
							Considera ponerte en contacto con Cuna si presentas dudas o problemas.
						</p>
					</div>
					<XamuActionButton :theme="eColors.DANGER" @click="USER.remove">
						<XamuIconFa name="trash-can" />
						<span>Eliminar cuenta</span>
					</XamuActionButton>
				</div>
				<div class="txt --gap-10 --width-100">
					<h4>Tratamiento de datos:</h4>
					<p>
						Cuna se limita a manejar un numero limitado de tus datos personales (nombre,
						correo y foto de perfil).
					</p>
				</div>
			</div>
		</section>
	</div>
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

	const USER = useUserStore();
</script>
