import { isEqual } from "lodash-es";

import type { iSelectOption } from "@open-xamu-co/ui-common-types";

import {
	type uSIAFaculty,
	type uSIAProgram,
	eSIALevel,
	eSIAPlace,
	eSIATypology,
	// Bogota
	eSIABogotaFaculty,
	eSIABogotaProgram,
	eSIAScienceBogotaProgram,
	eSIAMedicineBogotaProgram,
	eSIAVetMedicineBogotaProgram,
	eSIAEnfermeryBogotaProgram,
	eSIAArtsBogotaProgram,
	eSIAEngineeringBogotaProgram,
	eSIAOdontologyBogotaProgram,
	eSIALawBogotaProgram,
	eSIAHumanScienceBogotaProgram,
	eSIAEconomicalScienceBogotaProgram,
	eSIAAgrarianScienceBogotaProgram,
	// La Paz
	eSIAPregradoLaPazProgram,
	eSIALaPazProgram,
	eSIALaPazFaculty,
	// Medellin
	eSIAMedellinFaculty,
	eSIAMedellinProgram,
	eSIAMinesMedellinProgram,
	eSIAArchitectureMedellinProgram,
	eSIAScienceMedellinProgram,
	eSIAAgrarianSciencesMedellinProgram,
	eSIAHumanSciencesAMedellinProgram,
	// Manizales
	eSIAManizalesFaculty,
	eSIAManizalesProgram,
	eSIAEngineeringAndArchitectureManizalesProgram,
	eSIAExactSciencesManizalesProgram,
	eSIAManagementManizalesProgram,
	// Palmira
	eSIAPalmiraFaculty,
	eSIAPalmiraProgram,
	eSIAgronomicalSciencesPalmiraProgram,
	eSIAEngineeringAndAdministrationPalmiraProgram,
	eSIAVeterinarialMedicineAndZootechnyPalmiraProgram,
	// Tumaco
	eSIATumacoFaculty,
	eSIATumacoProgram,
	eSIAAdministrationTumacoProgram,
	eSIALawAndSocialPoliticsTumacoProgram,
	eSIANursingTumacoProgram,
	// Amazonia
	eSIAAmazoniaFaculty,
	eSIAAmazoniaProgram,
	eSIAArchitectureAmazoniaProgram,
	eSIANaturalSciencesAmazoniaProgram,
	eSIAHumanSciencesAmazoniaProgram,
	eSIAMiningAmazoniaProgram,
	// Caribe
	eSIACaribeFaculty,
	eSIACaribeProgram,
	eSIAMiningCaribeProgram,
	eSIANursingCaribeProgram,
	// Orinoquia
	eSIAOrinoquiaFaculty,
	eSIAOrinoquiaProgram,
	eSIAHumanSciencesOrinoquiaProgram,
	eSIAMiningOrinoquiaProgram,
	eSIANaturalSciencesOrinoquiaProgram,
	eSIANursingOrinoquiaProgram,
} from "~~/functions/src/types/SIA";
import type { Course } from "~/utils/types";

function toOptions(enumLike: object, scope?: string[]): iSelectOption[] {
	return Object.values(enumLike).reduce<iSelectOption[]>((acc, value) => {
		// Limit to given scope if any
		if (!scope || scope.includes(value)) acc.push({ value });

		return acc;
	}, []);
}

/**
 * Program related options
 */
export function useCourseProgramOptions(
	[level, place, faculty, program]: [
		(eSIALevel | Ref<eSIALevel | undefined>)?,
		(eSIAPlace | Ref<eSIAPlace | undefined>)?,
		(uSIAFaculty | Ref<uSIAFaculty | undefined>)?,
		(uSIAProgram | Ref<uSIAProgram | undefined>)?,
	] = [],
	noUndef?: boolean,
	course?: Ref<Course | null>
) {
	const USER = useUserStore();
	const selectedLevel = level && isRef(level) ? level : ref(level);
	const selectedPlace = place && isRef(place) ? place : ref(place);
	const selectedFaculty = faculty && isRef(faculty) ? faculty : ref(faculty);
	const selectedProgram = program && isRef(program) ? program : ref(program);

	// static
	const levels = toOptions(eSIALevel);
	const places = toOptions(eSIAPlace);
	// dynamic
	const faculties = computed<iSelectOption[]>(() => {
		switch (selectedPlace.value) {
			// facultades por sede
			case eSIAPlace.BOGOTÁ:
				return toOptions(eSIABogotaFaculty, course?.value?.faculties);
			case eSIAPlace.LA_PAZ:
				return toOptions(eSIALaPazFaculty, course?.value?.faculties);
			case eSIAPlace.MEDELLÍN:
				return toOptions(eSIAMedellinFaculty, course?.value?.faculties);
			case eSIAPlace.MANIZALES:
				return toOptions(eSIAManizalesFaculty, course?.value?.faculties);
			case eSIAPlace.PALMIRA:
				return toOptions(eSIAPalmiraFaculty, course?.value?.faculties);
			case eSIAPlace.TUMACO:
				return toOptions(eSIATumacoFaculty, course?.value?.faculties);
			case eSIAPlace.CARIBE:
				return toOptions(eSIACaribeFaculty, course?.value?.faculties);
			case eSIAPlace.AMAZONÍA:
				return toOptions(eSIAAmazoniaFaculty, course?.value?.faculties);
		}

		return [];
	});
	const programs = computed<iSelectOption[]>(() => {
		switch (selectedPlace.value) {
			case eSIAPlace.BOGOTÁ:
				switch (selectedFaculty.value) {
					// programas sede Bogota
					case eSIABogotaFaculty.SEDE_BOGOTÁ:
						return toOptions(eSIABogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.MEDICINA:
						return toOptions(eSIAMedicineBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.MEDICINA_VETERINARIA:
						return toOptions(eSIAVetMedicineBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.ENFERMERÍA:
						return toOptions(eSIAEnfermeryBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.ARTES:
						return toOptions(eSIAArtsBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.INGENIERÍA:
						return toOptions(eSIAEngineeringBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.ODONTOLOGÍA:
						return toOptions(eSIAOdontologyBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.DERECHO:
						return toOptions(eSIALawBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.CIENCIAS:
						return toOptions(eSIAScienceBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.CIENCIAS_HUMANAS:
						return toOptions(eSIAHumanScienceBogotaProgram, course?.value?.programs);
					case eSIABogotaFaculty.CIENCIAS_ECONÓMICAS:
						return toOptions(
							eSIAEconomicalScienceBogotaProgram,
							course?.value?.programs
						);
					case eSIABogotaFaculty.CIENCIAS_AGRARIAS:
						return toOptions(eSIAAgrarianScienceBogotaProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.LA_PAZ:
				switch (selectedFaculty.value) {
					// programas sede La Paz
					case eSIALaPazFaculty.SEDE_LA_PAZ:
						return toOptions(eSIALaPazProgram, course?.value?.programs);
					case eSIALaPazFaculty.ESCUELA_DE_PREGRADO:
						return toOptions(eSIAPregradoLaPazProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.MEDELLÍN:
				switch (selectedFaculty.value) {
					// programas sede Medellín
					case eSIAMedellinFaculty.SEDE_MEDELLÍN:
						return toOptions(eSIAMedellinProgram, course?.value?.programs);
					case eSIAMedellinFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMinesMedellinProgram, course?.value?.programs);
					case eSIAMedellinFaculty.FACULTAD_DE_ARQUITECTURA:
						return toOptions(eSIAArchitectureMedellinProgram, course?.value?.programs);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS:
						return toOptions(eSIAScienceMedellinProgram, course?.value?.programs);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_AGRARIAS:
						return toOptions(
							eSIAAgrarianSciencesMedellinProgram,
							course?.value?.programs
						);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_HUMANAS_Y_ECONÓMICAS_A:
						return toOptions(
							eSIAHumanSciencesAMedellinProgram,
							course?.value?.programs
						);
				}

				break;
			case eSIAPlace.MANIZALES:
				switch (selectedFaculty.value) {
					// programas sede Manizales
					case eSIAManizalesFaculty.SEDE_MANIZALES:
						return toOptions(eSIAManizalesProgram, course?.value?.programs);
					case eSIAManizalesFaculty.FACULTAD_DE_INGENIERIA_Y_ARQUITECTURA:
						return toOptions(
							eSIAEngineeringAndArchitectureManizalesProgram,
							course?.value?.programs
						);
					case eSIAManizalesFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(
							eSIAExactSciencesManizalesProgram,
							course?.value?.programs
						);
					case eSIAManizalesFaculty.FACULTAD_DE_ADMINISTRACIÓN:
						return toOptions(eSIAManagementManizalesProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.PALMIRA:
				switch (selectedFaculty.value) {
					// programas sede Palmira
					case eSIAPalmiraFaculty.SEDE_PALMIRA:
						return toOptions(eSIAPalmiraProgram, course?.value?.programs);
					case eSIAPalmiraFaculty.FACULTAD_DE_CIENCIAS_AGROPECUARIAS:
						return toOptions(
							eSIAgronomicalSciencesPalmiraProgram,
							course?.value?.programs
						);
					case eSIAPalmiraFaculty.FACULTAD_DE_INGENIERIA_Y_ADMINISTRACIÓN:
						return toOptions(
							eSIAEngineeringAndAdministrationPalmiraProgram,
							course?.value?.programs
						);
					case eSIAPalmiraFaculty.FACULTAD_DE_MEDICINA_VETERINARIA_Y_DE_ZOOTECNIA_PAET:
						return toOptions(
							eSIAVeterinarialMedicineAndZootechnyPalmiraProgram,
							course?.value?.programs
						);
				}

				break;
			case eSIAPlace.TUMACO:
				switch (selectedFaculty.value) {
					// programas sede Tumaco
					case eSIATumacoFaculty.SEDE_TUMACO:
						return toOptions(eSIATumacoProgram, course?.value?.programs);
					case eSIATumacoFaculty.FACULTAD_DE_ADMINISTRACION:
						return toOptions(eSIAAdministrationTumacoProgram, course?.value?.programs);
					case eSIATumacoFaculty.FACULTAD_DE_DERECHO_CIENCIAS_POLITICAS_Y_SOCIALES:
						return toOptions(
							eSIALawAndSocialPoliticsTumacoProgram,
							course?.value?.programs
						);
					case eSIATumacoFaculty.FACULTAD_DE_ENFERMERIA:
						return toOptions(eSIANursingTumacoProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.AMAZONÍA:
				switch (selectedFaculty.value) {
					// programas sede Amazonía
					case eSIAAmazoniaFaculty.SEDE_AMAZONIA:
						return toOptions(eSIAAmazoniaProgram, course?.value?.programs);
					case eSIAAmazoniaFaculty.FACULTAD_DE_ARQUITECTURA:
						return toOptions(eSIAArchitectureAmazoniaProgram, course?.value?.programs);
					case eSIAAmazoniaFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(
							eSIANaturalSciencesAmazoniaProgram,
							course?.value?.programs
						);
					case eSIAAmazoniaFaculty.FACULTAD_DE_CIENCIAS_HUMANAS:
						return toOptions(eSIAHumanSciencesAmazoniaProgram, course?.value?.programs);
					case eSIAAmazoniaFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningAmazoniaProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.CARIBE:
				switch (selectedFaculty.value) {
					// programas sede Caribe
					case eSIACaribeFaculty.SEDE_CARIBE:
						return toOptions(eSIACaribeProgram, course?.value?.programs);
					case eSIACaribeFaculty.FACULTAD_DE_ENFERMERÍA:
						return toOptions(eSIANursingCaribeProgram, course?.value?.programs);
					case eSIACaribeFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningCaribeProgram, course?.value?.programs);
				}

				break;
			case eSIAPlace.ORINOQUÍA:
				switch (selectedFaculty.value) {
					// programas sede Orinoquia
					case eSIAOrinoquiaFaculty.SEDE_ORINOQUIA:
						return toOptions(eSIAOrinoquiaProgram, course?.value?.programs);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_ENFERMERÍA:
						return toOptions(eSIANursingOrinoquiaProgram, course?.value?.programs);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(
							eSIANaturalSciencesOrinoquiaProgram,
							course?.value?.programs
						);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_CIENCIAS_HUMANAS:
						return toOptions(
							eSIAHumanSciencesOrinoquiaProgram,
							course?.value?.programs
						);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningOrinoquiaProgram, course?.value?.programs);
				}

				break;
		}

		return [];
	});

	// lifecycle
	watch(
		faculties,
		(newFaculties = []) => {
			const [newDefault] = newFaculties;

			// reset
			if (noUndef) {
				if (newDefault) selectedFaculty.value = <uSIAFaculty>newDefault.value;

				return;
			}

			selectedFaculty.value = undefined;
		},
		{ immediate: false }
	);
	watch(
		[programs, selectedProgram],
		([newPrograms = [], newProgram], [oldPrograms, oldProgram]) => {
			const [newDefault] = newPrograms;

			if (!newProgram) {
				if (noUndef && newDefault) selectedProgram.value = <uSIAProgram>newDefault.value;
			} else {
				if (!isEqual(newPrograms, oldPrograms)) {
					selectedProgram.value = undefined;

					return;
				}
				if (!selectedFaculty.value || newProgram === oldProgram) return;

				USER.setLastSearch(selectedFaculty.value, newProgram);
			}
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
export function useCourseTypeOptions(
	[typology]: [eSIATypology?] = [],
	course?: Ref<Course | null>
) {
	const selectedTypology = ref<eSIATypology | undefined>(typology || ("" as eSIATypology));

	// static
	const typologies = [
		{ value: "", alias: "CUALQUIERA" },
		...toOptions(eSIATypology, course?.value?.typologies),
	];

	return {
		selectedTypology,
		typologies,
	};
}
