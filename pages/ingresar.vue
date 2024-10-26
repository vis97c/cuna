<template>
	<div id="login" class="view --gap --bgColor-light">
		<section class="view-item --minHeight-100">
			<div class="holder">
				<div class="flx --flxColumn --flx-center --flx">
					<XamuLoaderContent :loading="loading" content class="grd --grdColumns-auto2:md">
						<div class="grd-item flx --flxColumn --flx-center">
							<div class="txt --txtAlign-center --txtAlign-left:md">
								<h1 class="--txtColor-primary-complement">¡Hola!</h1>
								<p>Nos alegra verte nuevamente</p>
							</div>
						</div>
						<form class="flx --flxColumn --flx-center-stretch">
							<div
								class="holder --maxWidth-440:md flx --flxColumn --flx-start-stretch --gap-20"
							>
								<div class="flx --flxColumn --flx-start-stretch --gap-20">
									<XamuActionButton
										:size="eSizes.LG"
										@click.prevent="loginWithGoogle"
									>
										<XamuIconFa name="google" brand :size="20" />
										<span>Inicia sesión con Google</span>
									</XamuActionButton>
								</div>
							</div>
						</form>
					</XamuLoaderContent>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { SweetAlertOptions } from "sweetalert2";
	import { ref } from "vue";
	import { debounce } from "lodash-es";
	import {
		type UserCredential,
		browserLocalPersistence,
		getAuth,
		setPersistence,
		signInWithEmailAndPassword,
	} from "firebase/auth";
	import { FirebaseError } from "firebase/app";

	import type { iInvalidInput, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import { useSwal } from "@open-xamu-co/ui-common-helpers";

	import type { NewUserValues } from "~/resources/types/values";

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

	const Swal = useSwal();
	const { getResponse } = useFormInput();
	const router = useRouter();

	const { restricted } = router.currentRoute.value.query;
	const loading = ref(false);
	const invalid = ref<iInvalidInput[]>([]);
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const loginInputs = ref(markRaw(useLoginInputs()));
	const loginWithGoogle = useGoogleAuth(loading);
</script>
