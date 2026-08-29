// @vitest-environment node
import fs from "node:fs";

import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestContext,
	type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { describe, it, beforeAll, afterAll } from "vitest";

describe("Firestore Security Rules", () => {
	let testEnv: RulesTestEnvironment;

	// Contexts
	let devCtx: RulesTestContext;
	let adminCtx: RulesTestContext;
	let userCtx: RulesTestContext;
	let guestCtx: RulesTestContext;

	beforeAll(async () => {
		testEnv = await initializeTestEnvironment({
			projectId: "cuna-test",
			firestore: {
				rules: fs.readFileSync("firestore.rules", "utf8"),
				host: "127.0.0.1",
				port: 8080,
			},
		});

		// Initialize contexts with fixed UIDs
		devCtx = testEnv.authenticatedContext("fulanito");
		adminCtx = testEnv.authenticatedContext("admin_uid");
		userCtx = testEnv.authenticatedContext("menganito");
		guestCtx = testEnv.unauthenticatedContext();

		// Seed required member profiles before checking rules, since rules use getRole()
		await testEnv.withSecurityRulesDisabled(async (context) => {
			const db = context.firestore();

			// Seed live instance
			await db.doc("instances/live").set({ name: "live", lock: false });

			// Seed member profiles under live instance
			await db.doc("instances/live/members/fulanito").set({ role: -1 }); // Developer
			await db.doc("instances/live/members/admin_uid").set({ role: 0 }); // Admin
			await db.doc("instances/live/members/menganito").set({ role: 3 }); // Regular user
		});
	});

	afterAll(async () => {
		await testEnv.clearFirestore();
		await testEnv.cleanup();
	});

	describe("Global Collections (Logs & Offenders)", () => {
		it("Logs: Any user (including guest) can create a log", async () => {
			const guestDb = guestCtx.firestore();

			await assertSucceeds(
				guestDb.collection("logs").add({ message: "Test log", lock: false })
			);
		});

		it("Logs: Only developer (role < 0) can read logs", async () => {
			const devDb = devCtx.firestore();
			const userDb = userCtx.firestore();

			await assertSucceeds(devDb.collection("logs").get());
			await assertFails(userDb.collection("logs").get());
		});

		it("Logs: Developer can delete unlocked logs", async () => {
			const devDb = devCtx.firestore();

			await testEnv.withSecurityRulesDisabled(async (context) => {
				await context
					.firestore()
					.doc("logs/test-log")
					.set({ message: "ToDelete", lock: false });
			});

			await assertSucceeds(devDb.doc("logs/test-log").delete());
		});
	});

	describe("Instances Collection", () => {
		it("Read: Any user (including guest) can read an instance by ID", async () => {
			const guestDb = guestCtx.firestore();

			await assertSucceeds(guestDb.doc("instances/live").get());
		});

		it("Update: Admins (role < 1) can update an instance", async () => {
			const adminDb = adminCtx.firestore();
			const userDb = userCtx.firestore();

			await assertSucceeds(
				adminDb.doc("instances/live").set({ name: "Updated Live" }, { merge: true })
			);
			await assertFails(
				userDb.doc("instances/live").set({ name: "Hacked Live" }, { merge: true })
			);
		});
	});

	describe("Members Collection", () => {
		it("Get: Authenticated users can get a member document", async () => {
			const userDb = userCtx.firestore();
			const guestDb = guestCtx.firestore();

			await assertSucceeds(userDb.doc("instances/live/members/menganito").get());
			await assertFails(guestDb.doc("instances/live/members/menganito").get());
		});

		it("List: Only developers/admins/moderators (role <= 2) can list all members", async () => {
			const adminDb = adminCtx.firestore();
			const userDb = userCtx.firestore();

			await assertSucceeds(adminDb.collection("instances/live/members").get());
			await assertFails(userDb.collection("instances/live/members").get());
		});

		it("Update: Users can update their own member profile", async () => {
			const userDb = userCtx.firestore();

			await assertSucceeds(
				userDb
					.doc("instances/live/members/menganito")
					.set({ name: "Menganito Updated" }, { merge: true })
			);
		});
	});

	describe("Notes Subcollection", () => {
		it("Create: Users (role <= 3) can create notes under their member doc", async () => {
			const userDb = userCtx.firestore();
			const userMemberRef = userDb.doc("instances/live/members/menganito");

			await assertSucceeds(
				userMemberRef.collection("notes").doc("note-1").set({
					body: "My note",
					createdByRef: userMemberRef,
				})
			);
		});

		it("Update: Author can update their note, but not another user's note", async () => {
			const devDb = devCtx.firestore();
			const userDb = userCtx.firestore();

			// Seed note created by fulanito
			await testEnv.withSecurityRulesDisabled(async (context) => {
				await context
					.firestore()
					.doc("instances/live/members/fulanito/notes/dev-note")
					.set({
						body: "Original dev note",
						createdByRef: context.firestore().doc("instances/live/members/fulanito"),
					});
			});

			// User attempts to edit dev's note -> should fail
			const userEditingDevNote = userDb.doc("instances/live/members/fulanito/notes/dev-note");

			await assertFails(userEditingDevNote.update({ body: "Tampered note" }));

			// Dev edits own note -> should succeed
			const devEditingDevNote = devDb.doc("instances/live/members/fulanito/notes/dev-note");

			await assertSucceeds(devEditingDevNote.update({ body: "Updated dev note" }));
		});
	});

	describe("Courses & Groups Subcollections", () => {
		it("Read: Courses and groups are publicly readable", async () => {
			const guestDb = guestCtx.firestore();

			await assertSucceeds(guestDb.collection("instances/live/courses").get());
		});

		it("Create & Update: Regular users (role <= 3) can create courses and groups", async () => {
			const userDb = userCtx.firestore();
			const courseRef = userDb.doc("instances/live/courses/course-1");
			const groupRef = courseRef.collection("groups").doc("group-1");

			await assertSucceeds(courseRef.set({ name: "Cálculo I" }));
			await assertSucceeds(groupRef.set({ name: "Grupo 1" }));
		});

		it("Delete: Only moderators or higher (role <= 2) can delete courses", async () => {
			const adminDb = adminCtx.firestore();
			const userDb = userCtx.firestore();

			await testEnv.withSecurityRulesDisabled(async (context) => {
				await context
					.firestore()
					.doc("instances/live/courses/course-to-delete")
					.set({ name: "Delete Me" });
			});

			await assertFails(userDb.doc("instances/live/courses/course-to-delete").delete());
			await assertSucceeds(adminDb.doc("instances/live/courses/course-to-delete").delete());
		});
	});
});
