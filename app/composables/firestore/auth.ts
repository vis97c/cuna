import debounce from "lodash-es/debounce";
import {
	browserLocalPersistence,
	setPersistence,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { ref } from "vue";

import type { iNodeFn } from "@open-xamu-co/ui-common-types";

import type { Member } from "~/utils/types/index.ts";
import { eMemberRole } from "~~/functions/src/types/entities/index.ts";

export function useGoogleAuth(defaultRdrPath = "/") {
	const { $clientAuth } = useNuxtApp();
	const SESSION = useSessionStore();
	const Swal = useSwal();

	const loading = ref(false);

	const loginWithGoogle = debounce(async (): Promise<void> => {
		const route = useRoute();
		const { restricted } = route.query;
		const rdr = typeof restricted === "string" && decodeURI(restricted);

		loading.value = true;

		try {
			if (!$clientAuth) throw new Error("Missing auth");

			const googleProvider = new GoogleAuthProvider();

			// Do not assume account
			// see: https://developers.google.com/identity/openid-connect/openid-connect?hl=es-419#authenticationuriparameters
			googleProvider.setCustomParameters({ prompt: "select_account" });

			await setPersistence($clientAuth, browserLocalPersistence);

			try {
				// Attempt sign with popup
				const { user } = await signInWithPopup($clientAuth, googleProvider);
				const {
					uid,
					displayName: userName,
					photoURL: userPhotoURL,
					isAnonymous,
					emailVerified,
				} = user;
				const token = await $clientAuth.currentUser?.getIdToken();

				// Update session, flatten member data
				SESSION.setMember(
					{
						uid,
						isAnonymous,
						// email,
						emailVerified,
						photoURL: userPhotoURL,
						role: eMemberRole.GUEST,
						name: userName || "",
					},
					token || ""
				);
			} catch (err) {
				// Not popup blocked, throw error
				if (!(err instanceof FirebaseError) || err.code !== "auth/popup-blocked") throw err;

				// Attemp sign with redirect instead
				await signInWithRedirect($clientAuth, googleProvider);
			}

			// rdr, Restricted rdr handled by plugin
			if (!rdr) await navigateTo({ path: defaultRdrPath, query: { rdr: "google-auth" } });
		} catch (err) {
			Swal.fire({
				title: "¡Algo sucedió!",
				text: "Ocurrió un error mientras iniciabas sesión",
				icon: "error",
			});
			useAppLogger("composables:useGoogleAuth", err);
		}

		loading.value = false;
	});

	return { loading, loginWithGoogle };
}

/** Do not remove member, just anonimize data */
export const useAnonymizeMember: iNodeFn<Member> = async (member) => {
	const SESSION = useSessionStore();
	const Swal = useSwal();
	const sessionRole = SESSION.member?.role ?? eMemberRole.GUEST;
	const memberRole = member.role ?? eMemberRole.GUEST;

	if (memberRole <= sessionRole) {
		Swal.fire({
			title: "No se puede eliminar",
			text: "No tienes permiso de eliminar este usuario",
			icon: "warning",
		});

		return [false];
	}

	const { value } = await Swal.firePrevent({
		title: "¿Anonimizar cuenta?",
		text: `¿Está seguro de que desea eliminar y anonimizar la cuenta de "${member.name}"? `,
		footer: "Se eliminará su acceso y sus datos personales de forma irreversible, pero se conservarán sus históricos financieros y de progreso.",
		icon: "warning",
	});

	if (value) {
		try {
			const success = await customFetch<boolean>("/api/admin/instance/members/anonymize", {
				method: "POST",
				body: { memberId: getDocumentId(member.id) },
			});

			if (success) {
				Swal.fire({
					title: "Cuenta anonimizada",
					text: "El usuario ha sido anonimizado con éxito.",
					icon: "success",
				});

				return [true];
			}
		} catch (err) {
			useAppLogger("components:alumnos:deleteMember", err);
			Swal.fire({
				title: "Error",
				text: "Ocurrió un error al intentar anonimizar la cuenta.",
				icon: "error",
			});
		}
	}

	return [false];
};
