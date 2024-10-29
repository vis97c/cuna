import type { iSelectOption } from "@open-xamu-co/ui-common-types";

import {
	eSIABogotaFaculty,
	eSIALaPazProgram,
	eSIALaPazFaculty,
	eSIALevel,
	eSIAPlace,
	eSIAPregradoLaPazProgram,
	eSIAScienceBogotaProgram,
	type uSIAFaculty,
	type uSIAProgram,
	eSIABogotaProgram,
	eSIAMedicineBogotaProgram,
	eSIAVetMedicineBogotaProgram,
	eSIAEnfermeryBogotaProgram,
	eSIAArtsBogotaProgram,
	eSIAEngineeringBogotaProgram,
	eSIAOdontologyBogotaProgram,
	eSIALawBogotaProgram,
	eSIAHumanScienceBogotaProgram,
	eSIAEconomicalScienceBogotaProgram,
	eSIAAgronomicalScienceBogotaProgram,
	eSIATypology,
} from "~/functions/src/types/SIA";

function toOptions(enumLike: object): iSelectOption[] {
	return Object.values(enumLike).map((value) => ({ value }));
}

/**
 * Program related options
 */
export function useCourseProgramOptions([level, place, faculty, program]: [
	eSIALevel?,
	eSIAPlace?,
	uSIAFaculty?,
	uSIAProgram?,
] = []) {
	const selectedLevel = ref<eSIALevel | undefined>(level);
	const selectedPlace = ref<eSIAPlace | undefined>(place);
	const selectedFaculty = ref<uSIAFaculty | undefined>(faculty);
	const selectedProgram = ref<uSIAProgram | undefined>(program);

	// static
	const levels = toOptions(eSIALevel);
	const places = toOptions(eSIAPlace);
	// dynamic
	const faculties = computed<iSelectOption[]>(() => {
		switch (selectedPlace.value) {
			// facultades por sede
			case eSIAPlace.BOGOTÁ:
				return toOptions(eSIABogotaFaculty);
			case eSIAPlace.LA_PAZ:
				return toOptions(eSIALaPazFaculty);
		}

		return [];
	});
	const programs = computed<iSelectOption[]>(() => {
		switch (selectedPlace.value) {
			case eSIAPlace.BOGOTÁ:
				switch (selectedFaculty.value) {
					// programas sede Bogota
					case eSIABogotaFaculty.SEDE_BOGOTÁ:
						return toOptions(eSIABogotaProgram);
					case eSIABogotaFaculty.MEDICINA:
						return toOptions(eSIAMedicineBogotaProgram);
					case eSIABogotaFaculty.MEDICINA_VETERINARIA:
						return toOptions(eSIAVetMedicineBogotaProgram);
					case eSIABogotaFaculty.ENFERMERÍA:
						return toOptions(eSIAEnfermeryBogotaProgram);
					case eSIABogotaFaculty.ARTES:
						return toOptions(eSIAArtsBogotaProgram);
					case eSIABogotaFaculty.INGENIERÍA:
						return toOptions(eSIAEngineeringBogotaProgram);
					case eSIABogotaFaculty.ODONTOLOGÍA:
						return toOptions(eSIAOdontologyBogotaProgram);
					case eSIABogotaFaculty.DERECHO:
						return toOptions(eSIALawBogotaProgram);
					case eSIABogotaFaculty.CIENCIAS:
						return toOptions(eSIAScienceBogotaProgram);
					case eSIABogotaFaculty.CIENCIAS_HUMANAS:
						return toOptions(eSIAHumanScienceBogotaProgram);
					case eSIABogotaFaculty.CIENCIAS_ECONÓMICAS:
						return toOptions(eSIAEconomicalScienceBogotaProgram);
					case eSIABogotaFaculty.CIENCIAS_AGRARIAS:
						return toOptions(eSIAAgronomicalScienceBogotaProgram);
				}

				break;
			case eSIAPlace.LA_PAZ:
				switch (selectedFaculty.value) {
					// programas sede La Paz
					case eSIALaPazFaculty.SEDE_LA_PAZ:
						return toOptions(eSIALaPazProgram);
					case eSIALaPazFaculty.ESCUELA_DE_PREGRADO:
						return toOptions(eSIAPregradoLaPazProgram);
				}

				break;
		}

		return [];
	});

	// lifecycle
	watch(
		selectedPlace,
		(newPlace, oldPlace) => {
			if (newPlace === oldPlace) return;

			// reset
			selectedFaculty.value = undefined;
			selectedProgram.value = undefined;
		},
		{ immediate: false }
	);
	watch(
		selectedFaculty,
		(newFaculty, oldFaculty) => {
			if (newFaculty === oldFaculty) return;

			// reset
			selectedProgram.value = undefined;
		},
		{ immediate: false }
	);

	return {
		selectedLevel,
		selectedPlace,
		selectedFaculty,
		selectedProgram,
		levels,
		places,
		faculties,
		programs,
	};
}

/**
 * Program related options
 */
export function useCourseTypeOptions([typology]: [eSIATypology?] = []) {
	const selectedTypology = ref<eSIATypology | undefined>(typology);

	// static
	const typologies = toOptions(eSIATypology);

	return {
		selectedTypology,
		typologies,
	};
}
