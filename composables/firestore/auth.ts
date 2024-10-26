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
	const router = useRouter();

	const { restricted } = router.currentRoute.value.query;

	const loginWithGoogle = debounce(async () => {
		try {
			loading.value = true;

			const auth = getAuth($clientFirebaseApp);
			const provider = new GoogleAuthProvider();

			await setPersistence(auth, browserLocalPersistence);
			await signInWithPopup(auth, provider);

			// rdr, Restricted rdr handled by plugin
			if (!restricted) router.push("/");
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
