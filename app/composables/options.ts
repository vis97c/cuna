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

function toOptions(enumLike: object): iSelectOption[] {
	return Object.values(enumLike).map((value) => ({ value }));
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
	noUndef?: boolean
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
				return toOptions(eSIABogotaFaculty);
			case eSIAPlace.LA_PAZ:
				return toOptions(eSIALaPazFaculty);
			case eSIAPlace.MEDELLÍN:
				return toOptions(eSIAMedellinFaculty);
			case eSIAPlace.MANIZALES:
				return toOptions(eSIAManizalesFaculty);
			case eSIAPlace.PALMIRA:
				return toOptions(eSIAPalmiraFaculty);
			case eSIAPlace.TUMACO:
				return toOptions(eSIATumacoFaculty);
			case eSIAPlace.CARIBE:
				return toOptions(eSIACaribeFaculty);
			case eSIAPlace.AMAZONÍA:
				return toOptions(eSIAAmazoniaFaculty);
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
						return toOptions(eSIAAgrarianScienceBogotaProgram);
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
			case eSIAPlace.MEDELLÍN:
				switch (selectedFaculty.value) {
					// programas sede Medellín
					case eSIAMedellinFaculty.SEDE_MEDELLÍN:
						return toOptions(eSIAMedellinProgram);
					case eSIAMedellinFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMinesMedellinProgram);
					case eSIAMedellinFaculty.FACULTAD_DE_ARQUITECTURA:
						return toOptions(eSIAArchitectureMedellinProgram);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS:
						return toOptions(eSIAScienceMedellinProgram);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_AGRARIAS:
						return toOptions(eSIAAgrarianSciencesMedellinProgram);
					case eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_HUMANAS_Y_ECONÓMICAS_A:
						return toOptions(eSIAHumanSciencesAMedellinProgram);
				}

				break;
			case eSIAPlace.MANIZALES:
				switch (selectedFaculty.value) {
					// programas sede Manizales
					case eSIAManizalesFaculty.SEDE_MANIZALES:
						return toOptions(eSIAManizalesProgram);
					case eSIAManizalesFaculty.FACULTAD_DE_INGENIERIA_Y_ARQUITECTURA:
						return toOptions(eSIAEngineeringAndArchitectureManizalesProgram);
					case eSIAManizalesFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(eSIAExactSciencesManizalesProgram);
					case eSIAManizalesFaculty.FACULTAD_DE_ADMINISTRACIÓN:
						return toOptions(eSIAManagementManizalesProgram);
				}

				break;
			case eSIAPlace.PALMIRA:
				switch (selectedFaculty.value) {
					// programas sede Palmira
					case eSIAPalmiraFaculty.SEDE_PALMIRA:
						return toOptions(eSIAPalmiraProgram);
					case eSIAPalmiraFaculty.FACULTAD_DE_CIENCIAS_AGROPECUARIAS:
						return toOptions(eSIAgronomicalSciencesPalmiraProgram);
					case eSIAPalmiraFaculty.FACULTAD_DE_INGENIERIA_Y_ADMINISTRACIÓN:
						return toOptions(eSIAEngineeringAndAdministrationPalmiraProgram);
					case eSIAPalmiraFaculty.FACULTAD_DE_MEDICINA_VETERINARIA_Y_DE_ZOOTECNIA_PAET:
						return toOptions(eSIAVeterinarialMedicineAndZootechnyPalmiraProgram);
				}

				break;
			case eSIAPlace.TUMACO:
				switch (selectedFaculty.value) {
					// programas sede Tumaco
					case eSIATumacoFaculty.SEDE_TUMACO:
						return toOptions(eSIATumacoProgram);
					case eSIATumacoFaculty.FACULTAD_DE_ADMINISTRACION:
						return toOptions(eSIAAdministrationTumacoProgram);
					case eSIATumacoFaculty.FACULTAD_DE_DERECHO_CIENCIAS_POLITICAS_Y_SOCIALES:
						return toOptions(eSIALawAndSocialPoliticsTumacoProgram);
					case eSIATumacoFaculty.FACULTAD_DE_ENFERMERIA:
						return toOptions(eSIANursingTumacoProgram);
				}

				break;
			case eSIAPlace.AMAZONÍA:
				switch (selectedFaculty.value) {
					// programas sede Amazonía
					case eSIAAmazoniaFaculty.SEDE_AMAZONIA:
						return toOptions(eSIAAmazoniaProgram);
					case eSIAAmazoniaFaculty.FACULTAD_DE_ARQUITECTURA:
						return toOptions(eSIAArchitectureAmazoniaProgram);
					case eSIAAmazoniaFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(eSIANaturalSciencesAmazoniaProgram);
					case eSIAAmazoniaFaculty.FACULTAD_DE_CIENCIAS_HUMANAS:
						return toOptions(eSIAHumanSciencesAmazoniaProgram);
					case eSIAAmazoniaFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningAmazoniaProgram);
				}

				break;
			case eSIAPlace.CARIBE:
				switch (selectedFaculty.value) {
					// programas sede Caribe
					case eSIACaribeFaculty.SEDE_CARIBE:
						return toOptions(eSIACaribeProgram);
					case eSIACaribeFaculty.FACULTAD_DE_ENFERMERÍA:
						return toOptions(eSIANursingCaribeProgram);
					case eSIACaribeFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningCaribeProgram);
				}

				break;
			case eSIAPlace.ORINOQUÍA:
				switch (selectedFaculty.value) {
					// programas sede Orinoquia
					case eSIAOrinoquiaFaculty.SEDE_ORINOQUIA:
						return toOptions(eSIAOrinoquiaProgram);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_ENFERMERÍA:
						return toOptions(eSIANursingOrinoquiaProgram);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES:
						return toOptions(eSIANaturalSciencesOrinoquiaProgram);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_CIENCIAS_HUMANAS:
						return toOptions(eSIAHumanSciencesOrinoquiaProgram);
					case eSIAOrinoquiaFaculty.FACULTAD_DE_MINAS:
						return toOptions(eSIAMiningOrinoquiaProgram);
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
export function useCourseTypeOptions([typology]: [eSIATypology?] = []) {
	const selectedTypology = ref<eSIATypology | undefined>(typology || ("" as eSIATypology));

	// static
	const typologies = [{ value: "", alias: "CUALQUIERA" }, ...toOptions(eSIATypology)];

	return {
		selectedTypology,
		typologies,
	};
}
