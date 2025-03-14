import { capitalize, deburr, startCase } from "lodash-es";

import type { SIACourse, SIAGroup, uSIAFaculty, uSIAProgram } from "~/functions/src/types/SIA";
import type { Course, Group, User } from "~/resources/types/entities";
import {
	eSIAAgrarianScienceBogotaProgram,
	eSIAAgrarianSciencesMedellinProgram,
	eSIAArchitectureMedellinProgram,
	eSIAArtsBogotaProgram,
	eSIABogotaFaculty,
	eSIABogotaProgram,
	eSIAEconomicalScienceBogotaProgram,
	eSIAEnfermeryBogotaProgram,
	eSIAEngineeringAndArchitectureManizalesProgram,
	eSIAEngineeringBogotaProgram,
	eSIAExactSciencesManizalesProgram,
	eSIAHumanScienceBogotaProgram,
	eSIAHumanSciencesAMedellinProgram,
	eSIALaPazFaculty,
	eSIALaPazProgram,
	eSIALawBogotaProgram,
	eSIAManagementManizalesProgram,
	eSIAManizalesFaculty,
	eSIAManizalesProgram,
	eSIAMedellinFaculty,
	eSIAMedellinProgram,
	eSIAMedicineBogotaProgram,
	eSIAMinesMedellinProgram,
	eSIAOdontologyBogotaProgram,
	eSIAPlace,
	eSIAPregradoLaPazProgram,
	eSIAScienceBogotaProgram,
	eSIAScienceMedellinProgram,
	eSIATypology,
	eSIAVetMedicineBogotaProgram,
} from "~/functions/src/types/SIA/enums";
import { isNotUndefString } from "~/resources/utils/guards";

interface UNALItem {
	faculty: uSIAFaculty;
	programs: uSIAProgram[];
}

const UNAL: Record<eSIAPlace, UNALItem[]> = {
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

export function useMapGroupFromSia(source: SIAGroup): Group {
	const programsString = source.PLANES_ASOCIADOS || "";
	const [, ...programs] = programsString.split("*** Plan:").map((p) => <uSIAProgram>p.trim());

	return {
		SIA: source.ID,
		name: source.GRUPO,
		spots: source.CUPOS,
		schedule: [
			source.HORARIO_LUNES,
			source.HORARIO_MARTES,
			source.HORARIO_MIERCOLES,
			source.HORARIO_JUEVES,
			source.HORARIO_VIERNES,
			source.HORARIO_SABADO,
			source.HORARIO_DOMINGO,
		],
		teachers: [startCase(source.DOCENTE.toLowerCase())],
		activity: source.ACTIVIDAD,
		availableSpots: source.CUPOS_DISPONIBLES,
		classrooms: [source.AULA],
		period: source.PERIODO,
		programs,
	};
}

/**
 * Map course from SIA beta
 */
export function useMapCourseFromSia(source: SIACourse): Course {
	// Generate deduped course UID
	const id = `courses/${useCyrb53([source.CODIGO_ASIGNATURA])}`;
	const groups: Group[] = [];
	const typology = source.TIPOLOGIA;
	const place = source.SEDE;
	let faculty = source.FACULTAD;
	let faculties = [faculty];
	let programs = source.PLANDEESTUDIO ? [source.PLANDEESTUDIO] : [];

	// Dedupe groups
	source.DETALLECURSOASIGNATURA.map(useMapGroupFromSia).forEach((group) => {
		// Groups can be duplicated diff(teacher, schedule, classroom)
		const groupIndex = groups.findIndex(({ name }) => name === group.name);

		// Index group
		if (groupIndex === -1) {
			// Assign one of the associated programs
			// Some global LE programs do not have an associated program and are hard to find on old SIA
			if (!programs.length && typology === eSIATypology.LIBRE_ELECCIÓN) {
				const [program] = group.programs || [];
				const associatedFaculty = UNAL[place].find((f) => f.programs.includes(program));

				if (!associatedFaculty) return groups.push(group);

				faculty = associatedFaculty.faculty;
				faculties = [faculty];
				programs = [program];
			}

			return groups.push(group);
		}

		const currentSchedule = groups[groupIndex]?.schedule || [];
		const newSchedule = group.schedule || [];
		const uniqueClassrooms = [
			...new Set([groups[groupIndex].classrooms, group.classrooms].flat()),
		].filter(isNotUndefString);
		const uniqueTeachers = [
			...new Set([groups[groupIndex].teachers, group.teachers].flat()),
		].filter(isNotUndefString);

		// Complement existing group data
		groups[groupIndex].classrooms = uniqueClassrooms;
		groups[groupIndex].teachers = uniqueTeachers;
		groups[groupIndex].schedule = [
			currentSchedule[0] || newSchedule[0], // monday
			currentSchedule[1] || newSchedule[1], // tuesday
			currentSchedule[2] || newSchedule[2], // wednesday
			currentSchedule[3] || newSchedule[3], // thursday
			currentSchedule[4] || newSchedule[4], // friday
			currentSchedule[5] || newSchedule[5], // saturday
			currentSchedule[6] || newSchedule[6], // sunday
		];
	});

	const spotsCount = groups.reduce((sum, { availableSpots = 0 }) => sum + availableSpots, 0);

	return {
		id,
		SIA: source.IDBUSCADORCURSO,
		name: capitalize(source.NOMBREASIGNATURA),
		alternativeNames: [source.NOMBREASIGNATURA],
		code: source.CODIGO_ASIGNATURA,
		credits: source.NUM_CREDITOS,
		typologies: [typology],
		level: source.NIVELDEESTUDIO,
		place,
		faculty,
		faculties,
		programs,
		groups,
		spotsCount,
	};
}

export function useMapCourse({ groups = [], ...course }: Course): Course {
	const SESSION = useSessionStore();
	const [, placeOnly] = deburr(SESSION.place).toLowerCase().replace(" de la", "").split("sede ");
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
