import { eMemberRole } from "~~/functions/src/types/entities";

/**
 * Get a custom token for uploading files
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentMember } = event.context;
	const { firebaseAuth } = getServerFirebase("api:instance:auth");

	try {
		debugFirebaseServer(event, "api:instance:auth");

		// Prevent listing if not assistant or bellow
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.MODERATOR) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
		}

		return firebaseAuth?.createCustomToken(currentMember.uid);
	} catch (err) {
		apiLogger(event, "api:instance:auth", err);

		throw err;
	}
});
