import type {
	eSIALevel,
	eSIAPlace,
	eSIATypology,
	uSIAFaculty,
	uSIAProgram,
} from "~~/functions/src/types/SIA";

export interface PartialCourseValues {
	name?: string;
	code?: string;
	level?: eSIALevel;
	place?: eSIAPlace;
	faculty?: uSIAFaculty;
	program?: uSIAProgram;
	typology?: eSIATypology;
}

export type CourseValuesWithCode = PartialCourseValues & { code: string };
export type CourseValuesWithName = PartialCourseValues & { name: string };

/**
 * Code or Name
 */
export type CourseValues = CourseValuesWithCode | CourseValuesWithName;

export interface InstanceValues {
	description?: string;
	keywords?: string;
}

export interface InstanceBannerValues {
	message: string;
	url: string;
}

export interface NoteValues {
	name: string;
	body: string;
	public: boolean;
	keywords?: string;
	slug?: string;
	lock?: boolean;
}
