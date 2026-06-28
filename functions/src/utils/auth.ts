import type { DocumentReference } from "firebase-admin/firestore";

import type { MemberData } from "../types/entities/index.js";

export function getAnonymizedMember(memberRef: DocumentReference<MemberData>) {
	return {
		name: "Usuario Eliminado",
		photoURL: null,
		email: null,
		uid: "", // Clear the Auth connection
		slug: `anon-${memberRef.id.substring(0, 8)}-${Math.floor(Math.random() * 10000)}`,
		locationCity: "",
		locationState: "",
		locationCountry: "CO",
		description: "Esta cuenta ha sido eliminada por solicitud del usuario.",
		updatedByRef: memberRef,
	};
}
