import { FormInput } from "@open-xamu-co/ui-common-helpers";
import type { tFormInput } from "@open-xamu-co/ui-common-types";

import type { Teacher } from "~/utils/types";

export function useTeacherSlugInputs(teacher: Teacher = {}): tFormInput[] {
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
