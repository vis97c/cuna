import { deburr } from "lodash-es";
import {
	type uSIAFaculty,
	type uSIAProgram,
	eSIAPlace,
	eSIABogotaFaculty,
	eSIABogotaProgram,
	eSIAMedicineBogotaProgram,
	eSIAVetMedicineBogotaProgram,
	eSIAEnfermeryBogotaProgram,
	eSIAArtsBogotaProgram,
	eSIAEngineeringBogotaProgram,
	eSIAOdontologyBogotaProgram,
	eSIALawBogotaProgram,
	eSIAScienceBogotaProgram,
	eSIAHumanScienceBogotaProgram,
	eSIAEconomicalScienceBogotaProgram,
	eSIAAgrarianScienceBogotaProgram,
	eSIALaPazFaculty,
	eSIALaPazProgram,
	eSIAPregradoLaPazProgram,
	eSIAMedellinFaculty,
	eSIAMedellinProgram,
	eSIAMinesMedellinProgram,
	eSIAArchitectureMedellinProgram,
	eSIAScienceMedellinProgram,
	eSIAAgrarianSciencesMedellinProgram,
	eSIAHumanSciencesAMedellinProgram,
	eSIAManizalesFaculty,
	eSIAManizalesProgram,
	eSIAEngineeringAndArchitectureManizalesProgram,
	eSIAExactSciencesManizalesProgram,
	eSIAManagementManizalesProgram,
	eSIAPalmiraFaculty,
	eSIAPalmiraProgram,
	eSIAAmazoniaFaculty,
	eSIAAmazoniaProgram,
	eSIACaribeFaculty,
	eSIACaribeProgram,
	eSIAOrinoquiaFaculty,
	eSIAOrinoquiaProgram,
	eSIATumacoFaculty,
	eSIATumacoProgram,
} from "~/functions/src/types/SIA";

import type { Course, User } from "~/resources/types/entities";

interface UNALItem {
	faculty: uSIAFaculty;
	programs: uSIAProgram[];
}

export const UNAL: Record<eSIAPlace, UNALItem[]> = {
	[eSIAPlace.BOGOTÁ]: [
		{
			faculty: eSIABogotaFaculty.SEDE_BOGOTÁ,
			programs: Object.values(eSIABogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.MEDICINA,
			programs: Object.values(eSIAMedicineBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.MEDICINA_VETERINARIA,
			programs: Object.values(eSIAVetMedicineBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.ENFERMERÍA,
			programs: Object.values(eSIAEnfermeryBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.ARTES,
			programs: Object.values(eSIAArtsBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.INGENIERÍA,
			programs: Object.values(eSIAEngineeringBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.ODONTOLOGÍA,
			programs: Object.values(eSIAOdontologyBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.DERECHO,
			programs: Object.values(eSIALawBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.CIENCIAS,
			programs: Object.values(eSIAScienceBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.CIENCIAS_HUMANAS,
			programs: Object.values(eSIAHumanScienceBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.CIENCIAS_ECONÓMICAS,
			programs: Object.values(eSIAEconomicalScienceBogotaProgram),
		},
		{
			faculty: eSIABogotaFaculty.CIENCIAS_AGRARIAS,
			programs: Object.values(eSIAAgrarianScienceBogotaProgram),
		},
	],
	[eSIAPlace.LA_PAZ]: [
		{
			faculty: eSIALaPazFaculty.SEDE_LA_PAZ,
			programs: Object.values(eSIALaPazProgram),
		},
		{
			faculty: eSIALaPazFaculty.ESCUELA_DE_PREGRADO,
			programs: Object.values(eSIAPregradoLaPazProgram),
		},
	],
	[eSIAPlace.MEDELLÍN]: [
		{
			faculty: eSIAMedellinFaculty.SEDE_MEDELLÍN,
			programs: Object.values(eSIAMedellinProgram),
		},
		{
			faculty: eSIAMedellinFaculty.FACULTAD_DE_MINAS,
			programs: Object.values(eSIAMinesMedellinProgram),
		},
		{
			faculty: eSIAMedellinFaculty.FACULTAD_DE_ARQUITECTURA,
			programs: Object.values(eSIAArchitectureMedellinProgram),
		},
		{
			faculty: eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS,
			programs: Object.values(eSIAScienceMedellinProgram),
		},
		{
			faculty: eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_AGRARIAS,
			programs: Object.values(eSIAAgrarianSciencesMedellinProgram),
		},
		{
			faculty: eSIAMedellinFaculty.FACULTAD_DE_CIENCIAS_HUMANAS_Y_ECONÓMICAS_A,
			programs: Object.values(eSIAHumanSciencesAMedellinProgram),
		},
	],
	[eSIAPlace.MANIZALES]: [
		{
			faculty: eSIAManizalesFaculty.SEDE_MANIZALES,
			programs: Object.values(eSIAManizalesProgram),
		},
		{
			faculty: eSIAManizalesFaculty.FACULTAD_DE_INGENIERIA_Y_ARQUITECTURA,
			programs: Object.values(eSIAEngineeringAndArchitectureManizalesProgram),
		},
		{
			faculty: eSIAManizalesFaculty.FACULTAD_DE_CIENCIAS_EXACTAS_Y_NATURALES,
			programs: Object.values(eSIAExactSciencesManizalesProgram),
		},
		{
			faculty: eSIAManizalesFaculty.FACULTAD_DE_ADMINISTRACIÓN,
			programs: Object.values(eSIAManagementManizalesProgram),
		},
	],
	[eSIAPlace.PALMIRA]: [
		{
			faculty: eSIAPalmiraFaculty.SEDE_PALMIRA,
			programs: Object.values(eSIAPalmiraProgram),
		},
	],
	[eSIAPlace.AMAZONÍA]: [
		{
			faculty: eSIAAmazoniaFaculty.SEDE_AMAZONIA,
			programs: Object.values(eSIAAmazoniaProgram),
		},
	],
	[eSIAPlace.CARIBE]: [
		{
			faculty: eSIACaribeFaculty.SEDE_CARIBE,
			programs: Object.values(eSIACaribeProgram),
		},
	],
	[eSIAPlace.ORINOQUÍA]: [
		{
			faculty: eSIAOrinoquiaFaculty.SEDE_ORINOQUIA,
			programs: Object.values(eSIAOrinoquiaProgram),
		},
	],
	[eSIAPlace.TUMACO]: [
		{
			faculty: eSIATumacoFaculty.SEDE_TUMACO,
			programs: Object.values(eSIATumacoProgram),
		},
	],
};

export function useMapUser({ role = 3, ...user }: User) {
	let roleName = "Invitado";

	role = role ?? 3;

	if (role < 0) roleName = "Desarrollador";
	else if (role < 1) roleName = "Administrador";
	else if (role < 2) roleName = "Editor";
	else if (role < 3) roleName = "Moderador";

	return { ...user, role: roleName };
}

export function useMapCourse({ groups = [], ...course }: Course): Course {
	const SESSION = useSessionStore();
	const [, placeOnly] = deburr(SESSION.place).toLowerCase().replace(" de la", "").split("sede ");

	if (!Array.isArray(groups)) groups = [];

	const thisPlace = groups.some(({ name = "" }) => {
		const lowerName = deburr(name).toLowerCase();

		return lowerName.includes(placeOnly);
	});
	const withPlaces = groups.some(({ name = "" }) => {
		const lowerName = deburr(name).toLowerCase();

		return lowerName.includes("sede");
	});
	const filteredGroups = groups.filter(({ name }) => {
		const lowerName = deburr(name).toLowerCase();

		if (
			!SESSION.withNonRegular &&
			(lowerName.includes("peama") || lowerName.includes("paes"))
		) {
			return false;
		} else if (thisPlace) {
			return lowerName.includes(placeOnly);
		} else if (withPlaces) {
			return lowerName.includes("otras sedes");
		}

		return true;
	});

	return { ...course, groups: filteredGroups, spotsCount: useCountSpots(filteredGroups) };
}
