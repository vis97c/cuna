import type { UserRecord } from "firebase-admin/auth";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

import type { InstanceData } from "~~/functions/src/types/entities";
import { getFirebase } from "~~/functions/src/utils/firebase";

export const TEST_ADMIN_EMAIL = "admin@cuna.com";
export const TEST_ADMIN_PASSWORD = "AdminPassword123!";

/**
 * Global setup for Playwright tests.
 * Runs once before all tests.
 */
export default async function globalSetup() {
	process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
	process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

	const projectId = process.env.F_PROJECT_ID || process.env.GCLOUD_PROJECT || "cuna-2980b9";
	const { firebaseFirestore: db, firebaseAuth: auth } = getFirebase("test:e2e", { projectId });
	let adminUser: UserRecord;

	try {
		adminUser = await auth.getUserByEmail(TEST_ADMIN_EMAIL);
		await auth.updateUser(adminUser.uid, {
			password: TEST_ADMIN_PASSWORD,
			emailVerified: true,
		});
	} catch {
		adminUser = await auth.createUser({
			email: TEST_ADMIN_EMAIL,
			password: TEST_ADMIN_PASSWORD,
			emailVerified: true,
			displayName: "Administrador",
		});
	}

	const instanceId = process.env.INSTANCE || "live";
	const instanceRef: DocumentReference<InstanceData> = db.doc(`instances/${instanceId}`);
	const instanceSnap = await instanceRef.get();

	if (!instanceSnap.exists || !instanceSnap.data()?.createdAt) {
		console.log(
			`Seeding base instance '${instanceId}' (project: '${projectId}') into Firestore emulator...`
		);

		const createdAt = FieldValue.serverTimestamp();
		const createdByRef = instanceRef.collection("members").doc(adminUser.uid);

		await instanceRef.set(
			{
				name: "CUNA UNAL",
				slogan: "Visor de cupos UNAL",
				description: "Plataforma de cursos y cupos UNAL",
				locationCountry: "CO",
				config: {
					domains: ["localhost", "127.0.0.1", "cuna.com"],
				},
				url: "http://localhost:3000",
				createdAt,
				updatedAt: createdAt,
				createdByRef,
				updatedByRef: createdByRef,
			},
			{ merge: true }
		);

		await createdByRef.set(
			{
				uid: adminUser.uid,
				name: "Administrador",
				role: 0,
				slug: "administrador",
				createdAt,
				updatedAt: createdAt,
			},
			{ merge: true }
		);
	}

	await new Promise((resolve) => setTimeout(resolve, 2000));
}
