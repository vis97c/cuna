import { FormInput } from "@open-xamu-co/ui-common-helpers";

import type { Teacher } from "~/utils/types";

export function useTeacherSlugInputs(teacher: Teacher = {}): FormInput[] {
	return [
		new FormInput({
			values: [teacher?.losEstudiantesSlug || ""],
			name: "losEstudiantesSlug",
			title: 'Slug de "los estudiantes" del profesor',
			placeholder: "Ej: andres-perez-sosa",
			autocomplete: "off",
			required: true,
		}),
	];
}
