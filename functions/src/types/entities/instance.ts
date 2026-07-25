import type { Timestamp as clientTimestamp } from "firebase/firestore";
import type { DocumentReference, Timestamp as adminTimestamp } from "firebase-admin/firestore";

import type { eSIALevel, eSIAPlace, eSIATypology } from "../SIA/index.ts";
import type { AuditData, MemberData } from "./member.ts";
import type { SearchData } from "./base.ts";

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

export interface InstanceDataConfig extends OldCunaConfig {
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
	/**
	 * When tenants are enabled, domains are required
	 */
	domains?: string[];
}

/**
 * App instance
 */
export interface InstanceData extends AuditData, SearchData {
	// details
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
	config?: InstanceDataConfig;
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
	ownedByRef?: DocumentReference<MemberData>;
	/** @automated instance disabled date */
	disabledAt?: adminTimestamp | false;
	/** @cached gateway key available */
	withGatewayKey?: boolean;
	/** @automated @searchable */
	membersCount?: number;
	/** @automated @searchable */
	coursesCount?: number;
	/** @automated @searchable */
	notesCount?: number;
}
