import type { iSelectOption } from "@open-xamu-co/ui-common-types";
import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Course } from "~/resources/types/entities";
import { eSIAScienceProgram } from "~/functions/src/types/SIA";

export function useCourseInputs(
	options: { programs?: iSelectOption[] } = {},
	course: Course = {}
): FormInput[] {
	return [
		new FormInput({
			values: [course?.name || ""],
			name: "name",
			title: "Nombre del curso",
			placeholder: "Ej: Sistemas numéricos",
			icon: "chess-pawn",
		}),
		new FormInput({
			values: [course?.code || ""],
			name: "code",
			title: "Codigo del curso",
			placeholder: "Ej: 2015181",
			icon: "hashtag",
		}),
		new FormInput({
			values: [course?.program || eSIAScienceProgram.CC],
			name: "program",
			required: true,
			title: "Programa del curso",
			placeholder: "Ej: Ciencias de la computación",
			options: options?.programs,
			type: eFormType.SELECT_FILTER,
		}),
	];
}
