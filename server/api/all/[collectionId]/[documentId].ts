import { debugFirebaseServer, resolveSnapshotRefs } from "~/server/utils/firebase";
import { defineConditionallyCachedEventHandler } from "~/server/utils/nuxt";

export default defineConditionallyCachedEventHandler(async (event) => {
	try {
		const collectionId = getRouterParam(event, "collectionId");
		const documentId = getRouterParam(event, "documentId");

		debugFirebaseServer(event, "api:all:collection:documentId", collectionId, documentId);

		if (!collectionId || !documentId) {
			throw createError({
				statusCode: 400,
				statusMessage: `collectionId & documentId are required`,
			});
		}

		const path = `${collectionId}/${documentId}`;
		const documentRef = apiFirestore.doc(path);
		const snapshot = await documentRef.get();

		if (!snapshot.exists) {
			throw createError({
				statusCode: 404,
				statusMessage: `No document with the path '${path}' exists`,
			});
		}

		const params = getQuery(event);
		const canModerate = getRequestHeader(event, "canModerate");
		const level = Array.isArray(params.level) || !params.level ? 0 : Number(params.level);
		const omit = Array.isArray(params.omit) ? params.omit : [params.omit];

		return resolveSnapshotRefs(snapshot, { level, omit, canModerate });
	} catch (err) {
		console.error(err);

		return null;
	}
});
