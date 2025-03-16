import { FormInput } from "@open-xamu-co/ui-common-helpers";
import { eFormType } from "@open-xamu-co/ui-common-enums";

import type { Group } from "~/resources/types/entities";

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
