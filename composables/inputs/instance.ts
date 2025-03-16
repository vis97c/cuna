import { eFormType } from "@open-xamu-co/ui-common-enums";
import { FormInput } from "@open-xamu-co/ui-common-helpers";

import type { Instance } from "~/resources/types/entities";

export function useInstanceSEOInputs(instance: Instance = {}): FormInput[] {
	return [
		new FormInput({
			values: [instance.description || ""],
			name: "description",
			title: "Descripción de la tienda",
			placeholder: "Ej: Cuna se caracteriza por...",
			type: eFormType.LONGTEXT,
		}),
		new FormInput({
			values: [instance.keywords?.join?.(", ") || ""],
			name: "keywords",
			title: "Términos clave (separados por comas)",
			placeholder: "Ej: Cursos, Cupos disponibles",
		}),
	];
}

export function useInstanceBannerInputs(instance: Instance = {}): FormInput[] {
	return [
		new FormInput({
			values: [instance?.banner?.message || ""],
			name: "message",
			title: "Mensaje de la tienda",
			placeholder: "Ej: Nueva funcion",
			type: eFormType.LONGTEXT,
		}),
		new FormInput({
			values: [instance?.banner?.url || ""],
			name: "url",
			title: "Url del mensaje",
			placeholder: "Ej: https://www.random-url.com.co",
			icon: "at",
		}),
	];
}
