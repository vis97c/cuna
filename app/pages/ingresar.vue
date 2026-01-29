<template>
	<div id="login" class="view --bgColor-light">
		<section class="view-item --minHeightVh-100">
			<XamuLoaderContent
				class="holder flx --flxColumn --flx-center"
				:loading="loading"
				label="Iniciando sesión..."
				content
			>
				<div class="txt --txtAlign-center">
					<h1 class="--txtLineHeight-sm">Bienvenidx</h1>
					<p>Nos alegra verte nuevamente</p>
				</div>
				<form class="flx --flxColumn --flx-center-stretch">
					<XamuActionButton
						:size="eSizes.LG"
						:theme="eColors.DANGER"
						@click.prevent="loginWithGoogle"
					>
						<XamuIconFa name="google" brand :size="20" />
						<span>Inicia sesión con Google</span>
					</XamuActionButton>
					<p class="--txtSize-xs --txtAlign-center">Usa tu cuenta UNAL para acceder</p>
				</form>
			</XamuLoaderContent>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	/**
	 * Login page
	 *
	 * @page
	 */
	definePageMeta({
		title: "Ingresar",
		middleware: ["guest-only"],
	});

	const { loading, loginWithGoogle } = useGoogleAuth();
</script>
