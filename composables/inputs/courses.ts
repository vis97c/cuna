import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Course } from "~/resources/types/entities";
import { eSIALevel } from "~/functions/src/types/SIA";

export function useCourseInputs(course: Course = {}): FormInput[] {
	const SESSION = useSessionStore();
	const { selectedFaculty, faculties, programs } = useCourseProgramOptions([
		eSIALevel.PREGRADO,
		SESSION.place,
		SESSION.lastFacultySearch,
		SESSION.lastProgramSearch,
	]);
	const { typologies } = useCourseTypeOptions();
	const facultyInput = new FormInput(
		{
			values: [course?.faculty || SESSION.lastFacultySearch],
			name: "faculty",
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
					// set first program as value
					programInput.options = newPrograms;
					programInput.values = [newPrograms[0].value as any];

					unwatch();
				},
				{ immediate: false }
			);

			selectedFaculty.value = newFaculty;
		}
	);
	const programInput = new FormInput({
		values: [course?.program || SESSION.lastProgramSearch],
		name: "program",
		title: "Programa del curso (Sede Bogotá)",
		placeholder: "Ej: Ciencias de la computación",
		options: programs.value,
		type: eFormType.SELECT,
		icon: "chess-rook",
	});

	return [
		facultyInput,
		programInput,
		new FormInput({
			values: [course?.typology || ""],
			name: "typology",
			title: "Tipología del curso ",
			placeholder: "Ej: Libre elección",
			options: typologies,
			type: eFormType.SELECT_FILTER,
			icon: "chess-bishop",
		}),
		new FormInput({
			values: [course?.name || ""],
			name: "name",
			title: "Nombre del curso",
			placeholder: "Ej: Sistemas numéricos",
			icon: "chess-knight",
			autocomplete: "off",
		}),
		new FormInput({
			values: [course?.code || ""],
			name: "code",
			title: "Codigo del curso",
			placeholder: "Ej: 2015181",
			icon: "hashtag",
		}),
		new FormInput({
			values: [SESSION.place],
			name: "place",
			type: eFormType.HIDDEN,
		}),
	];
}
