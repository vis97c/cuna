import { Filter, type CollectionReference, type Query } from "firebase-admin/firestore";

import { getBoolean } from "~/resources/utils/node";
import { debugFirebaseServer, getOrderedQuery, getEdgesPage } from "~/server/utils/firebase";
import { defineConditionallyCachedEventHandler } from "~/server/utils/nuxt";
import { triGram } from "~/resources/utils/firestore";

/**
 * Search for courses by name
 *
 * @see https://es.stackoverflow.com/questions/316170/c%c3%b3mo-hacer-una-consulta-del-tipo-like-en-firebase
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	try {
		let { name, code, place, faculty, program, typology, page } = getQuery(event);

		name = Array.isArray(name) ? name[0] : name;
		code = Array.isArray(code) ? code[0] : code;
		place = Array.isArray(place) ? place[0] : place;
		faculty = Array.isArray(faculty) ? faculty[0] : faculty;
		program = Array.isArray(program) ? program[0] : program;
		typology = Array.isArray(typology) ? typology[0] : typology;
		page = getBoolean(page);

		let query: CollectionReference | Query = apiFirestore.collection("courses");

		debugFirebaseServer(event, "api:courses", { name, code, faculty, typology, page });

		// where code equals
		if (code) query = query.where("code", "==", code);
		else if (name && typeof name === "string") {
			// search by name instead
			const indexes = triGram([name]);

			if (!indexes.length) return null;
			if (place) query = query.where("place", "==", place); // where place equals
			if (faculty) query = query.where("faculty", "==", faculty); // where faculty equals
			if (program) {
				// where program equals
				query = query.where(
					Filter.or(
						Filter.where("programsIndexes.0", "==", program),
						Filter.where("programsIndexes.1", "==", program),
						Filter.where("programsIndexes.2", "==", program),
						Filter.where("programsIndexes.3", "==", program),
						Filter.where("programsIndexes.4", "==", program),
						Filter.where("programsIndexes.5", "==", program)
					)
				);
			}

			query = query.orderBy("name").where("indexes", "array-contains-any", indexes);
		} else return null;

		if (typology) {
			// where typology equals
			query = query.where(
				Filter.or(
					Filter.where("typologiesIndexes.0", "==", typology),
					Filter.where("typologiesIndexes.1", "==", typology),
					Filter.where("typologiesIndexes.2", "==", typology)
				)
			);
		}

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);
		else return getQueryAsEdges(event, query);
	} catch (err) {
		console.error(err);

		return null;
	}
});
