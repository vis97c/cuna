import type { Timestamp as clientTimestamp } from "firebase/firestore";
import type { DocumentReference, Timestamp as adminTimestamp } from "firebase-admin/firestore";

import type {
	InstanceData,
	InstanceDataConfig,
	InstanceMemberData,
	SharedData,
} from "@open-xamu-co/firebase-nuxt/functions";

import type { eSIALevel, eSIAPlace, eSIATypology } from "../SIA";
import type { ExtendedUserData } from "./user";
import type { eMemberRole } from "../../enums";
import type { GroupData } from "./course";

/**
 * Old config for migration
 *
 * Keep for compatibility with old instances
 */
interface OldCunaConfig {
	/**
	 * Explorer V1 under maintenance till
	 *
	 * @deprecated No longer active, use v2
	 * @since 23/03/2025
	 */
	explorerV1MaintenanceTillAt?: clientTimestamp | adminTimestamp | Date;
	/**
	 * @example https://bobt42d1b3.execute-api.us-east-1.amazonaws.com/api/v1
	 *
	 * @deprecated No longer active, use v2
	 * @since 23/03/2025
	 */
	explorerV1CoursesURL?: string;
	/**
	 * @example /buscadorcursos/busqueda/primernivel2
	 *
	 * @deprecated No longer active, use v2
	 * @since 23/03/2025
	 */
	explorerV1CoursesPath?: string;
	/**
	 * Explorer V2 under maintenance till
	 *
	 * @since 23/03/2025
	 */
	explorerV2MaintenanceTillAt?: clientTimestamp | adminTimestamp | Date;
	/**
	 * Explorador de cursos
	 *
	 * @since 23/03/2025
	 * @example https://n0n0ftmy9b.execute-api.us-east-1.amazonaws.com
	 */
	explorerV2CoursesURL?: string;
}

export interface ExtendedInstanceDataConfig extends InstanceDataConfig, OldCunaConfig {
	/** Cuna version */
	version?: string;
	/**
	 * Bloquear la navegacion con un mensaje
	 */
	maintenanceMessage?: string;
	/**
	 * Old SIA under maintenance till
	 */
	siaMaintenanceTillAt?: clientTimestamp | adminTimestamp | Date;
	/**
	 * Number of minutes before refreshing a course
	 * @v2 Regulate scraped groups cache
	 */
	coursesRefreshRate?: number;
	/**
	 * Number of minutes before scraping a course
	 * @v2 Regulate scraped courses cache
	 */
	coursesScrapeRate?: number;
	/**
	 * @example https://sia.unal.edu.co
	 */
	siaOldURL?: string;
	/**
	 * @example /Catalogo/facespublico/public/servicioPublico.jsf
	 */
	siaOldPath?: string;
	/**
	 * @example ?taskflowId=task-flow-AC_CatalogoAsignaturas
	 */
	siaOldQuery?: string;
	/**
	 * @example https://losestudiantes.com
	 */
	losEstudiantesUrl?: string;
	/**
	 * @example /universidad-nacional/courses
	 */
	losEstudiantesCoursesPath?: string;
	/**
	 * @example /universidad-nacional/professors
	 */
	losEstudiantesProfessorsPath?: string;
	siaOldLevel?: Record<eSIALevel, `${number}`>;
	siaOldPlace?: Record<eSIAPlace, `${number}`>;
	/**
	 * Strings because numbers are being rotated daily
	 */
	siaOldTypology?: Record<eSIATypology, string>;
	/**
	 * Notes characters limit
	 *
	 * @v2
	 * @example 4096
	 */
	notesCharactersLimit?: number;
	/**
	 * Proxies list
	 * Proxies could break at any time
	 *
	 * @example ["socks4://68.71.249.153:48606"]
	 */
	proxies?: string[];
	/**
	 * Ping URL
	 * @example https://status.search.google.com
	 */
	pingUrl?: string;
	/**
	 * Bypass indexing of programs during search for given places
	 * @example [eSIAPlace.BOGOTÁ]
	 */
	preindexedSearch?: eSIAPlace[];
}

/**
 * App instance
 */
export interface ExtendedInstanceData extends InstanceData {
	// details
	name?: string;
	description?: string;
	keywords?: string[];
	/** SEO Image */
	image?: string;
	url?: string;
	banner?: { message?: string; url?: string };
	// contact
	whatsappNumber?: string;
	whatsappIndicative?: `${string}+${number}`;
	// socials
	tiktokId?: string;
	twitterId?: string;
	instagramId?: string;
	facebookId?: string;
	/**
	 * Api, flexible if endpoints do change
	 */
	config?: ExtendedInstanceDataConfig;
	/**
	 * Feature flags
	 */
	flags?: {
		/**
		 * User can track courses in realtime
		 */
		trackCourses?: boolean;
	};
	// Location
	address?: string;
	zip?: string;
	// Contact
	email?: string;
	/** Custom css */
	css?: string;
	/** @automated instance owner */
	ownedByRef?: DocumentReference<ExtendedUserData>;
	/** @automated instance disabled date */
	disabledAt?: adminTimestamp | false;
	/** @automated unique slug */
	slug?: string;
	/** @cached gateway key available */
	withGatewayKey?: boolean;
}

/**
 * Instance member
 *
 * @collection instances/members
 */
export interface ExtendedInstanceMemberData extends InstanceMemberData {
	role?: eMemberRole;
	/**
	 * Enrolled courses (codes)
	 */
	enrolledRefs?: DocumentReference<GroupData>[];
	userRef?: DocumentReference<ExtendedUserData>;
	/** Could be non existent */
	rootMemberRef?: DocumentReference<ExtendedInstanceMemberData>;
	/** @automated User is banned */
	bannedAt?: adminTimestamp;
}

/**
 * Store abuse
 * Keep track of abussive behavior by users
 *
 * This should not represent a ban, userData.bannedAt should do that
 *
 * @collection instance/members/abuses
 */
export interface InstanceMemberAbuseData extends SharedData {
	at?: string;
	message?: string;
	/** Who commited the abuse */
	commitedByRef?: DocumentReference<ExtendedUserData>;
}
