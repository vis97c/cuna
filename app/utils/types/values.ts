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

/**
 * Values from useInstanceInputs
 */
export interface InstanceValues {
	name: string;
	description?: string;
	keywords?: string;
	slogan: string;
	email: string;
	whatsappNumber: string;
	whatsappIndicative: `${string}+${number}`;
	whatsappText: string;
	locationCity: string;
	locationState: string;
	locationCountry: string;
	address: string;
	facebookId: string;
	instagramId: string;
	tiktokId: string;
	twitterId: string;
	slug?: string;
	lock?: boolean;
}

/**
 * Values from useInstanceConfigInputs
 */
export interface InstanceConfigValues {
	url: string;
	domains: string;
}

/**
 * Values from useInstanceBannerInputs
 */
export interface InstanceBannerValues {
	bannerMessage: string;
	bannerUrl: string;
}

/**
 * Values from useNoteInputs
 */
export interface NoteValues {
	name: string;
	body: string;
	public: 1 | 2 | 3;
	keywords?: string;
	slug?: string;
	lock?: boolean;
}
