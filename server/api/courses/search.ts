import type { CollectionReference, Query } from "firebase-admin/firestore";

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
		let { name, code, faculty, program, typology, page } = getQuery(event);

		name = Array.isArray(name) ? name[0] : name;
		code = Array.isArray(code) ? code[0] : code;
		faculty = Array.isArray(faculty) ? faculty[0] : faculty;
		program = Array.isArray(program) ? program[0] : program;
		typology = Array.isArray(typology) ? typology[0] : typology;
		page = getBoolean(page);

		let query: CollectionReference | Query = apiFirestore.collection("courses");

		debugFirebaseServer(event, "api:courses", { name, code, faculty, typology, page });

		// where code equals
		if (code) query = query.where("code", "==", code);
		else if (name && typeof name === "string") {
			if (faculty) query = query.where("faculty", "==", faculty); // where faculty equals
			if (program) query = query.where("program", "==", program); // where program equals

			// search by name instead
			const indexes = triGram([name]);

			query = query.orderBy("indexes").where("indexes", "array-contains-any", indexes);
		} else return null;

		if (typology) query = query.where("typology", "==", typology); // where typology equals

		// order at last
		query = getOrderedQuery(event, query);

		if (page) return getEdgesPage(event, query);
		else return getQueryAsEdges(event, query);
	} catch (err) {
		console.error(err);

		return null;
	}
});
