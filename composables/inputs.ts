import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Course, Group, Teacher } from "~/resources/types/entities";
import { eSIALevel } from "~/functions/src/types/SIA";

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

export function useGroupInputs(group: Group = {}): FormInput[] {
	return [
		new FormInput({
			values: [group?.name || ""],
			name: "name",
			title: "Nombre del grupo",
			placeholder: "Ej: Grupo 1",
			autocomplete: "off",
			required: true,
		}),
		new FormInput({
			values: [group?.activity || ""],
			name: "activity",
			title: "Actividad del grupo",
			placeholder: "Ej: Clase magistral",
			autocomplete: "off",
			required: true,
		}),
		new FormInput({
			values: [group?.spots || 0],
			name: "spots",
			title: "Cupo total del grupo",
			placeholder: "Ej: 40",
			min: 0,
			type: eFormType.NUMBER,
			required: true,
		}),
		new FormInput({
			values: [group?.availableSpots || 0],
			name: "availableSpots",
			title: "Cupos disponibles (No debe superar los cupos)",
			placeholder: "Ej: 3",
			min: 0,
			type: eFormType.NUMBER,
			required: true,
		}),
		new FormInput({
			values: group?.teachers || [""],
			name: "teachers",
			title: "Docentes",
			placeholder: "Ej: Jaimito Perez Sosa",
			min: 1,
			multiple: true,
			required: true,
		}),
		new FormInput({
			values: group?.classrooms || [""],
			name: "classrooms",
			title: "Espacios",
			placeholder: "Ej: 610-101",
			min: 1,
			multiple: true,
			required: true,
		}),
		new FormInput({
			name: "schedule",
			title: "Horario del curso",
			defaults: [
				{
					type: eFormType.TEXT,
					placeholder: "Horario Lunes, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Martes, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Miercoles, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Jueves, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Viernes, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Sabado, Ej: 18:00|20:00",
				},
				{
					type: eFormType.TEXT,
					placeholder: "Horario Domingo, Ej: 18:00|20:00",
				},
			],
		}),
	];
}

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
