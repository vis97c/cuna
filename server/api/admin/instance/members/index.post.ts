import { type CollectionReference, type Query, Filter } from "firebase-admin/firestore";

import { eMemberRole, type MemberData } from "~~/functions/src/types/entities";
import { getWords, soundexEs } from "~~/functions/src/utils/search";

/**
 * Get the edges from the "instance/members" collection.
 *
 * @auth assistant
 * @order createdAt
 */
export default defineConditionallyCachedEventHandler(async (event) => {
	const { currentMember, currentInstance, currentInstanceRef } = event.context;
	const Allow = "POST,HEAD";

	try {
		// Override CORS headers
		setResponseHeaders(event, {
			Allow,
			"Access-Control-Allow-Methods": Allow,
			"Content-Type": "application/json",
			"Cache-Control": "no-store", // Browser cache is not allowed
		});

		// Only POST, HEAD & OPTIONS are allowed
		if (!["POST", "HEAD", "OPTIONS"].includes(event.method?.toUpperCase())) {
			throw createError({ statusCode: 405, statusMessage: "Unsupported method" });
		} else if (event.method?.toUpperCase() === "OPTIONS") {
			// Options only needs allow headers
			return sendNoContent(event);
		}

		// Instance is required (Means we have a valid domain)
		if (!currentInstanceRef || !currentInstance) {
			throw createError({ statusCode: 401, statusMessage: "Missing instance" });
		}

		// Prevent listing if not assistant or bellow
		if (currentMember?.role === undefined || currentMember.role > eMemberRole.MODERATOR) {
			throw createError({ statusCode: 401, statusMessage: "Insufficient permissions" });
		}

		const membersRef: CollectionReference<MemberData> =
			currentInstanceRef.collection("members");
		const params = getQuery(event);
		const id = getQueryString("id", params);
		/** Roles to allow */
		const roles = params.roles
			? Array.isArray(params.roles)
				? params.roles.map(Number)
				: [Number(params.roles)]
			: undefined;
		const name = getQueryString("name", params);
		const page = getBoolean(params.page);
		const requestedDeletion = getBoolean(params.requestedDeletion);

		debugFirebaseServer(event, "api:admin:instance:members", {
			page,
			id,
			name,
			roles,
			requestedDeletion,
		});

		// Bypass body for HEAD requests
		// Since we always return an array or an object, we can just return 200
		if (event.method?.toUpperCase() === "HEAD") {
			setResponseStatus(event, 200);

			// Prevent no content status
			return "Ok";
		}

		if (id && !page) {
			// Get single document by Id
			const snapshot = await membersRef.doc(id).get();

			if (!snapshot.exists) {
				throw createError({ statusCode: 404, statusMessage: "Member not found" });
			}

			const node = await resolveServerRefs(event, snapshot);

			return [{ cursor: encodeServerCursor(snapshot.ref), node }];
		}

		let query: CollectionReference | Query = membersRef;

		// Require uid to be present (Non anonymized members)
		query = query.where("uid", "!=", "");

		// Get members by role
		// We have to use or because firebase does not allow using multiple "in" & "array-contains" in the same query
		if (roles?.length) {
			if (roles.length === 1) {
				query = query.where("role", "==", roles[0]);
			} else {
				const byRole = roles.map((r) => Filter.where("role", "==", r));

				query = query.where(Filter.or(...byRole));
			}
		}

		if (name) {
			// Search by name
			const soundex = soundexEs(getWords(name).join(""));

			if (!soundex) return null;

			debugFirebaseServer(event, "api:admin:instance:members:search", { soundex });

			// Get by matching indexes
			query = query.where("indexes", "array-contains", soundex);
			// Order by search relevance then name
			query = query.orderBy("indexesWeights", "desc").orderBy("name");
		}

		const resolver = new QueryResolver(event, query);

		return resolver.resolve();
	} catch (err) {
		apiLogger(event, "api:admin:instance:members", err);

		throw err;
	}
});
