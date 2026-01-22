import type { tFormInput } from "@open-xamu-co/ui-common-types";
import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Note } from "~/utils/types";

export function useNoteInputs(note: Note = {}): tFormInput[] {
	const USER = useUserStore();

	const inputs: tFormInput[] = [
		new FormInput({
			values: [note.name || ""],
			name: "name",
			required: true,
			title: "Nombre de la nota",
			placeholder: "Ej: Relatos abstractos",
			icon: "box",
		}),
	];

	// Edit existing note
	if (note.slug) {
		inputs.push(
			new FormInput({
				values: [note.body || ""],
				name: "body",
				required: true,
				title: "Texto de la nota",
				placeholder: "Ej: La usurpación del hombre por el hombre...",
				type: eFormType.CODE,
			}),
			new FormInput({
				values: [note.keywords?.join?.(", ") || ""],
				name: "keywords",
				title: "Términos clave (separados por comas)",
				placeholder: "Ej: Hombre, usurpación",
			}),
			new FormInput({
				values: [note.public ?? false],
				name: "public",
				title: "Nota publica",
				placeholder: "¿Mostrar la nota a otros usuarios?",
				type: eFormType.BOOLEAN,
			}),
			new FormInput({
				values: [note.slug || ""],
				name: "slug",
				required: true,
				title: "Slug de la nota",
				placeholder: "Ej: mi-nota",
				icon: "box",
			})
		);

		// Admin only
		if (USER.canDevelop) {
			inputs.push(
				new FormInput({
					values: [note.lock ?? false],
					name: "lock",
					title: "Nota bloqueada",
					placeholder: "¿Bloquear slug y no eliminar?",
					type: eFormType.BOOLEAN,
				})
			);
		}
	}

	return inputs;
}
