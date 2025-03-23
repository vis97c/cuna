import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Course } from "~/resources/types/entities";
import { eSIALevel, type uSIAFaculty } from "~/functions/src/types/SIA";

export function useCourseInputs(course: Course = {}): FormInput[] {
	const SESSION = useSessionStore();
	const fixCourse = !!course?.scrapedWithErrorsAt;
	const { selectedFaculty, faculties, programs } = useCourseProgramOptions([
		eSIALevel.PREGRADO,
		SESSION.place,
		SESSION.lastFacultySearch,
		SESSION.lastProgramSearch,
	]);
	const { typologies } = useCourseTypeOptions();
	const facultyInput = new FormInput(
		{
			values: [
				course?.faculty || fixCourse
					? <uSIAFaculty>faculties.value[0].value
					: SESSION.lastFacultySearch,
			],
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
					if (fixCourse) {
						newPrograms.unshift({ value: "", alias: "CUALQUIERA" });
					}

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

	if (fixCourse) {
		programs.value.unshift({ value: "", alias: "CUALQUIERA" });
	}

	const programInput = new FormInput({
		values: [fixCourse ? "" : course?.program || SESSION.lastProgramSearch],
		name: "program",
		title: "Programa del curso (Sede Bogotá)",
		placeholder: "Ej: Ciencias de la computación",
		options: programs.value,
		type: eFormType.SELECT,
		icon: "chess-rook",
	});

	const inputs: FormInput[] = [
		facultyInput,
		programInput,
		new FormInput({
			values: [course?.typologies?.[0] || ""],
			name: "typology",
			title: "Tipología del curso ",
			placeholder: "Ej: Libre elección",
			options: typologies,
			type: eFormType.SELECT,
			icon: "chess-bishop",
		}),
	];

	// Fix course
	if (fixCourse) return inputs;

	return [
		...inputs,
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
