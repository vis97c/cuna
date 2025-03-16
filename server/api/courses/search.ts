import { Filter, type CollectionReference, type Query } from "firebase-admin/firestore";

import type {
	eSIALevel,
	eSIAPlace,
	uSIAFaculty,
	uSIAProgram,
	eSIATypology,
} from "~/functions/src/types/SIA";
import { getBoolean } from "~/resources/utils/node";
import { triGram } from "~/resources/utils/firestore";

/**
 * Search for courses by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async function (event, instance, auth) {
	const { serverFirestore } = getServerFirebase();

	try {
		const name: string = getQueryParam("name", event) || "";
		const code: string = getQueryParam("code", event) || "";
		const level: eSIALevel = getQueryParam("level", event);
		const place: eSIAPlace = getQueryParam("place", event);
		const faculty: uSIAFaculty = getQueryParam("faculty", event);
		const program: uSIAProgram = getQueryParam("program", event);
		const typology: eSIATypology | undefined = getQueryParam("typology", event);
		const page = getBoolean(getQueryParam("page", event) || "");

		// Require auth
		if (!auth) throw createError({ statusCode: 401, statusMessage: `Missing auth` });

		let query: CollectionReference | Query = serverFirestore.collection("courses");
		let indexes: string[] = [];

		debugFirebaseServer(event, "api:courses:search", { name, code, program, typology, page });

		// where code equals
		if (code) query = query.where("code", "==", code);
		else if (name && typeof name === "string") {
			// search by name instead
			indexes = triGram([name]);

			/**
			 * limited subset of documents
			 *
			 * According to firebase docs, queries are limited to 30 disjuntion operations
			 * @see https://firebase.google.com/docs/firestore/query-data/queries#limits_on_or_queries
			 */
			indexes = indexes.slice(0, Math.min(10, indexes.length));

			if (!indexes.length) return null;
			if (level) query = query.where("level", "==", level); // where level equals
			if (place) query = query.where("place", "==", place); // where place equals
			if (faculty) query = query.where("faculty", "==", faculty); // where faculty equals
			if (program) {
				// where program equals
				if (indexes.length > 5 || typology) {
					query = query.where(
						Filter.or(
							Filter.where("programsIndexes.0", "==", program),
							Filter.where("programsIndexes.1", "==", program)
						)
					);
				} else {
					query = query.where(
						Filter.or(
							Filter.where("programsIndexes.0", "==", program),
							Filter.where("programsIndexes.1", "==", program),
							Filter.where("programsIndexes.2", "==", program),
							Filter.where("programsIndexes.3", "==", program)
						)
					);
				}
			}

			query = query.orderBy("name").where("indexes", "array-contains-any", indexes);
		} else return null;

		if (typology) {
			// where typology equals
			if (indexes.length > 5) {
				query = query.where("typologiesIndexes.0", "==", typology);
			} else {
				query = query.where(
					Filter.or(
						Filter.where("typologiesIndexes.0", "==", typology),
						Filter.where("typologiesIndexes.1", "==", typology)
					)
				);
			}
		}

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage({ event, instance, auth }, query);
		else return getQueryAsEdges({ event, instance, auth }, query);
	} catch (err) {
		if (isError(err)) {
			serverLogger("api:courses:search", err.message, { path: event.path, err });
		}

		throw err;
	}
});
