export default defineConditionallyCachedEventHandler(async (event) => {
	const { serverFirestore } = getServerFirebase();

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
		const documentRef = serverFirestore.doc(path);
		const snapshot = await documentRef.get();

		if (!snapshot.exists) {
			throw createError({
				statusCode: 404,
				statusMessage: `No document with the path '${path}' exists`,
			});
		}

		const params = getQuery(event);
		const level = Array.isArray(params.level) || !params.level ? 0 : Number(params.level);
		const omit = Array.isArray(params.omit) ? params.omit : [params.omit];

		return resolveSnapshotRefs(snapshot, { level, omit });
	} catch (err) {
		if (isError(err)) serverLogger("api:all:[collectionId]:[documentId]", err.message, err);

		throw err;
	}
});
