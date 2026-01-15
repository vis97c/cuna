import type { CollectionReference } from "firebase-admin/firestore";

import type { InstanceLogData } from "@open-xamu-co/firebase-nuxt/functions";
import { getFirebase } from "@open-xamu-co/firebase-nuxt/functions/firebase";
import { onCreated, onUpdated } from "@open-xamu-co/firebase-nuxt/functions/event";
import { makeGetSlug } from "@open-xamu-co/firebase-nuxt/functions/slugs";
import { rootInstanceId } from "@open-xamu-co/firebase-nuxt/server/environment";

import type {
	ExtendedInstanceData,
	ExtendedInstanceMemberData,
	ExtendedUserData,
	InstanceMemberAbuseData,
} from "./types/entities/index.js";
import { eMemberRole } from "./enums.js";
import { offenderLogger } from "@open-xamu-co/firebase-nuxt/functions/logger";

const getInstanceSlug = makeGetSlug("instances");

// instances timestamp
export const onCreatedInstance = onCreated<ExtendedInstanceData>(
	"instances",
	async (created, { logger }) => {
		const { firebaseFirestore } = getFirebase("onCreatedInstance");
		const instanceRef = created.ref;
		const rootInstanceRef = firebaseFirestore
			.collection("instances")
			.doc(rootInstanceId.value());
		const usersRef: CollectionReference<ExtendedUserData> =
			firebaseFirestore.collection("users");
		const membersRef: CollectionReference<ExtendedInstanceMemberData> =
			instanceRef.collection("members");

		try {
			const { slug, name, updatedByRef } = created.data();

			if (updatedByRef) {
				const ownedByRef = membersRef.doc(updatedByRef.id);
				const userRef = usersRef.doc(updatedByRef.id);

				// Set owner role, do not await
				ownedByRef.set({ userRef, role: eMemberRole.ADMIN });
			}

			const newSlug = await getInstanceSlug(firebaseFirestore, slug || name);

			// Get url from root instance
			const rootInstance = (await rootInstanceRef.get()).data();
			const url = rootInstance?.url;

			if (!url) throw new Error("Missing root instance url");

			const { hostname } = new URL(url);

			return {
				url: `https://${newSlug}.${hostname}`,
				slug: newSlug,
				ownedByRef: updatedByRef,
			};
		} catch (err) {
			logger("functions:instances:onCreatedInstance", err);

			throw err;
		}
	},
	{
		defaults: {
			disabledAt: false,
			banner: { message: "Bienvenidx a mi instancia" },
			lock: false,
		},
	}
);
export const onUpdatedInstance = onUpdated<ExtendedInstanceData>(
	"instances",
	async (updated, existing, { logger }) => {
		const { firebaseFirestore } = getFirebase("onUpdatedInstance");

		try {
			const existingData = existing.data();
			const { name = "", slug = "", lock } = updated.data();

			// Prevent slug from being updated
			if (existingData.slug !== slug || existingData.name === name || lock) return;

			const updatedSlug = await getInstanceSlug(firebaseFirestore, name, existingData.slug);

			return { slug: updatedSlug };
		} catch (err) {
			logger("functions:instances:onUpdatedInstance", err);

			throw err;
		}
	}
);

// logs timestamp
export const onCreatedInstanceLog = onCreated<InstanceLogData>(
	"instances/logs",
	(createdDoc) => {
		const { firebaseFirestore } = getFirebase("onCreatedInstanceLog");
		const { internal, ...log } = createdDoc.data();

		if (internal) return;

		try {
			// Attempt to log offender
			offenderLogger(firebaseFirestore, createdDoc.ref, log.metadata);
		} catch (err) {
			const logsRef = firebaseFirestore.collection("logs");

			// Internal log (Prevent infinite loop)
			logsRef.add({
				at: "functions:instances:onCreatedInstanceLog",
				message: "Error logging offender",
				error: err,
				metadata: log,
				internal: true,
			});
		}
	},
	{
		defaults: {
			lock: false,
		},
	}
);
export const onUpdatedInstanceLog = onUpdated<InstanceLogData>("instances/logs");

// Counters timestamp
export const onCreatedInstanceCounter = onCreated("instances/counters", undefined, {
	defaults: {
		lock: true,
	},
});
export const onUpdatedInstanceCounter = onUpdated("instances/counters");

// Members timestamp
export const onCreatedInstanceMember = onCreated<ExtendedInstanceMemberData>(
	"instances/members",
	undefined,
	{
		defaults: { lock: true },
		exclude: ["role"],
	}
);
export const onUpdatedInstanceMember = onUpdated<ExtendedInstanceMemberData>("instances/members");

// Members abuses timestamp
export const onCreatedInstanceMemberAbuse = onCreated<InstanceMemberAbuseData>(
	"instances/members/abuses",
	undefined,
	{ defaults: { lock: false } }
);
export const onUpdatedInstanceMemberAbuse = onUpdated<InstanceMemberAbuseData>(
	"instances/members/abuses"
);
