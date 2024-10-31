import type { Ref } from "vue";
import { debounce } from "lodash-es";
import {
	browserLocalPersistence,
	getAuth,
	setPersistence,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { useSwal } from "@open-xamu-co/ui-common-helpers";

export function useGoogleAuth(loading: Ref<boolean>) {
	const { $clientFirebaseApp } = useNuxtApp();
	const Swal = useSwal();

	const loginWithGoogle = debounce(async () => {
		const router = useRouter();
		const route = useRoute();
		const { restricted } = route.query;

		try {
			loading.value = true;

			const auth = getAuth($clientFirebaseApp);
			const provider = new GoogleAuthProvider();

			// Do not assume account
			// see: https://developers.google.com/identity/openid-connect/openid-connect?hl=es-419#authenticationuriparameters
			provider.setCustomParameters({ prompt: "select_account" });

			await setPersistence(auth, browserLocalPersistence);
			await signInWithPopup(auth, provider);

			// rdr, Restricted rdr handled by plugin
			if (!restricted && route.path !== "/") router.push("/");
		} catch (err: FirebaseError | unknown) {
			console.error(err);

			if (err instanceof FirebaseError) console.debug(err.code);

			Swal.fire({
				title: "¡Algo sucedió!",
				text: "Ocurrio un error mientras registrabamos tus datos",
				icon: "error",
			});
		}

		loading.value = false;
	});

	return loginWithGoogle;
}
