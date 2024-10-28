<template>
	<XamuLoaderContent
		class="holder --maxWidth-440:md flx --flxColumn --flx-start-stretch --gap-20"
		:loading="loading"
		content
	>
		<form class="flx --flxColumn --flx-center-stretch">
			<XamuActionButton
				:theme="eColors.DANGER"
				:size="eSizes.LG"
				@click.prevent="loginWithGoogle"
			>
				<XamuIconFa name="google" brand :size="20" />
				<span>Inicia sesión con Google</span>
			</XamuActionButton>
			<div class="txt --txtAlign-center --gap-0">
				<p class="--txtSize-sm --txtColor-dark5">Usa tu cuenta UNAL para acceder</p>
			</div>
		</form>
	</XamuLoaderContent>
</template>

<script setup lang="ts">
	import { ref } from "vue";

	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	/**
	 * Login page
	 *
	 * @page
	 */
	definePageMeta({
		path_label: "Ingresar",
		title: "Ingresar",
		middleware: ["guest-only"],
		preferScrollTheme: true,
	});

	const loading = ref(false);
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const loginWithGoogle = useGoogleAuth(loading);
</script>
