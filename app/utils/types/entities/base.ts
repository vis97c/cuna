import type { DocumentReference as AdminDocumentReference } from "firebase-admin/firestore";
import type {
	DocumentReference as ClientDocumentReference,
	FieldValue,
	Timestamp as ClientTimestamp,
} from "firebase/firestore";

import type { FirebaseData } from "~~/functions/src/types/entities/base";
import type { MemberInput } from "./member";

/**
 * Transforms admin document reference to client document data
 */
type GetClientData<Data> = Data extends FirebaseData ? OutputFromData<Data> : never;

type GetOutputKey<K extends string | number | symbol> = K extends `${infer Km}${"Ref" | "Refs"}`
	? Km
	: K;

/**
 * Get output data from firestore, with the actual data from refs
 *
 * @output
 */
export type OutputFromData<
	Data extends FirebaseData | RefFromData<FirebaseData>,
	O extends keyof Data = never,
> = {
	[K in keyof Data as K extends O ? never : GetOutputKey<K>]?: K extends `${string}At`
		? string | Date
		: Exclude<Data[K], undefined> extends AdminDocumentReference<infer ArrKData>[]
			? GetClientData<ArrKData>[]
			: Exclude<Data[K], undefined> extends AdminDocumentReference<infer KData>
				? GetClientData<KData>
				: Exclude<Data[K], FieldValue | undefined> extends ClientDocumentReference<
							RefFromData<infer CArrKData>
					  >[]
					? GetClientData<CArrKData>[]
					: Exclude<Data[K], FieldValue | undefined> extends ClientDocumentReference<
								RefFromData<infer CKData>
						  >
						? GetClientData<CKData>
						: Data[K];
} & {
	/** @automated Document path */
	id?: string;
};

/**
 * Get output data from firestore
 *
 * @output
 */
export type RefFromData<Data extends FirebaseData, O extends keyof Data = never> = {
	[K in keyof Data as K extends O ? never : K]?: K extends `${string}At`
		? ClientTimestamp
		: Exclude<Data[K], undefined> extends AdminDocumentReference<infer ArrKData>[]
			? ArrKData extends FirebaseData
				? ClientDocumentReference<RefFromData<ArrKData>>[] | FieldValue
				: never
			: Exclude<Data[K], undefined> extends AdminDocumentReference<infer KData>
				? KData extends FirebaseData
					? ClientDocumentReference<RefFromData<KData>> | FieldValue
					: never
				: Data[K];
};

/**
 * Get valid input data for firestore
 *
 * @input
 */
export type InputFromData<Data extends FirebaseData, O extends keyof Data = never> = {
	[K in keyof Data as K extends O ? never : K]?: K extends `${string}At`
		? string | Date | ClientTimestamp | FieldValue
		: K extends `${string}ByRef`
			? MemberInput | FieldValue
			: Exclude<Data[K], undefined> extends AdminDocumentReference[]
				? ClientDocumentReference[] | FieldValue
				: Exclude<Data[K], undefined> extends AdminDocumentReference
					? ClientDocumentReference | FieldValue
					: Data[K];
} & {
	/** @automated Document path */
	id?: string;
};
