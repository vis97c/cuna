import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Course } from "~/resources/types/entities";
import { eSIAScienceBogotaProgram } from "~/functions/src/types/SIA";
import { eSIABogotaFaculty, eSIALevel, eSIAPlace } from "~/functions/src/types/SIA/enums";

export function useCourseInputs(course: Course = {}): FormInput[] {
	const { selectedFaculty, faculties, programs } = useCourseProgramOptions([
		eSIALevel.PREGRADO,
		eSIAPlace.BOGOTÁ,
		eSIABogotaFaculty.CIENCIAS,
		eSIAScienceBogotaProgram.CC,
	]);

	const facultyInput = new FormInput(
		{
			values: [course?.faculty || eSIABogotaFaculty.CIENCIAS],
			name: "program",
			required: true,
			title: "Facultad del curso (Sede Bogotá)",
			placeholder: "Ej: Ciencias",
			options: faculties.value,
			type: eFormType.SELECT,
			icon: "chess-queen",
		},
		([newFaculty]) => {
			const unwatch = watch(
				programs,
				(newPrograms) => {
					unwatch();
					// set first program as value
					programInput.options = [newPrograms[0]];
					setTimeout(() => (programInput.options = newPrograms));
				},
				{ immediate: false }
			);

			selectedFaculty.value = newFaculty;
		}
	);
	const programInput = new FormInput({
		values: [course?.program || eSIAScienceBogotaProgram.CC],
		name: "program",
		required: true,
		title: "Programa del curso (Sede Bogotá)",
		placeholder: "Ej: Ciencias de la computación",
		options: programs.value,
		type: eFormType.SELECT_FILTER,
		icon: "chess-rook",
	});

	return [
		facultyInput,
		programInput,
		new FormInput({
			values: [course?.name || ""],
			name: "name",
			title: "Nombre del curso",
			placeholder: "Ej: Sistemas numéricos",
			icon: "chess-knight",
		}),
		new FormInput({
			values: [course?.code || ""],
			name: "code",
			title: "Codigo del curso",
			placeholder: "Ej: 2015181",
			icon: "hashtag",
		}),
	];
}
