import fs from "node:fs";
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

let currentTest = 1;

/**
 * Logs a test as passed.
 * @param {number} number - The test number.
 * @param {string} message - The test description.
 */
function logTest(number, message) {
	console.log(`\x1b[32mTEST ${String(number).padStart(2, "0")} PASSED:\x1b[0m`, message);
	currentTest++;
}

/**
 * Cleans up the test environment.
 */
async function cleanup(exitCode) {
	await testEnv.clearFirestore();
	await testEnv.cleanup();
	process.exit(exitCode);
}

/**
 * Initializes the test environment.
 *
 * @see https://firebase.google.com/docs/firestore/security/test-rules-emulator
 */
const testEnv = await initializeTestEnvironment({
	// projectId: process.env.F_PROJECT_ID || "cuna-2980b9",
	projectId: "test-project",
	firestore: {
		rules: fs.readFileSync("firestore.rules", "utf8"),
		host: "localhost",
		port: 8080,
	},
});

try {
	// Set contexts
	const mainContext = testEnv.authenticatedContext("fulanito", {});
	const secondaryContext = testEnv.authenticatedContext("menganito", {});
	const guestContext = testEnv.unauthenticatedContext();
	// Set users
	const mainUsersRef = mainContext.firestore().collection("users");
	const secondaryUsersRef = secondaryContext.firestore().collection("users");
	const mainUserRef = mainUsersRef.doc("fulanito");
	const secondaryUserRef = secondaryUsersRef.doc("menganito");

	// Test auth context user write
	await assertSucceeds(mainUserRef.set({ name: "Fulanito", uid: "fulanito" }));
	await assertSucceeds(secondaryUserRef.set({ name: "Menganito", uid: "menganito" }));
	logTest(1, "Created users");
	await assertFails(mainUsersRef.get());
	logTest(2, "New user cannot get a list of users");

	// Set instance (sudo), normally this should be done via admin-sdk
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const sudoInstanceRef = context.firestore().doc("instances/live");

		await assertSucceeds(sudoInstanceRef.set({ name: "live" }));
		logTest(3, "Created instance as admin with id live");
	});

	// Get instance references
	const authInstanceRef = mainContext.firestore().collection("instances").doc("live");
	const secondaryInstanceRef = secondaryContext.firestore().collection("instances").doc("live");

	// Test auth context, get instance
	await assertSucceeds(authInstanceRef.get());
	logTest(4, "An user can get an instance");

	// Get instance members references
	const mainMemberRef = authInstanceRef.collection("members").doc("fulanito");
	const secondaryMemberRef = secondaryInstanceRef.collection("members").doc("menganito");

	// Test auth context, set privileges
	await assertSucceeds(mainMemberRef.set({ userRef: mainUserRef, role: -1 })); // Admin
	await assertSucceeds(secondaryMemberRef.set({ userRef: secondaryUserRef, role: 3 })); // Normal user
	logTest(5, "Created instance members with privileges");

	// Test privileges, get users
	await assertSucceeds(mainUsersRef.get());
	await assertFails(secondaryUsersRef.get());
	logTest(6, "Only main user should be able to get a list of users");

	// Set guest references
	// Guest context is unauthenticated, not even an anonymous user
	const guestUsersRefs = guestContext.firestore().collection("users");
	const guestUserRef = guestUsersRefs.doc("fulanito");

	// Test guest context user read
	await assertFails(guestUsersRefs.get());
	logTest(7, "Guests cannot get a list of users");
	await assertFails(guestUserRef.get());
	logTest(8, "Guests cannot get a specific user");

	// Add an error log
	const guestLogsRef = guestContext.firestore().collection("logs");
	const guestLogRef = guestLogsRef.doc("error");

	// Test guest context log write
	await assertSucceeds(guestLogRef.set({ message: "error", lock: false }));
	logTest(9, "Guest user can write a log");
	await assertFails(guestLogsRef.get());
	logTest(10, "Guest user cannot read a log");

	// Get main log reference
	const mainLogRef = mainContext.firestore().collection("logs").doc("error");

	// Test main context log delete
	await assertSucceeds(mainLogRef.delete());
	logTest(11, "Main user can delete a log");

	// Test note creation
	const mainNoteRef = mainMemberRef.collection("notes").doc("main-note");
	const secondaryNoteRef = secondaryMemberRef.collection("notes").doc("secondary-note");

	await assertSucceeds(
		mainNoteRef.set({
			body: "Note by main user",
			createdByRef: mainMemberRef,
		})
	);
	await assertSucceeds(
		secondaryNoteRef.set({
			body: "Note by secondary user",
			createdByRef: secondaryMemberRef,
		})
	);
	logTest(12, "Users can create notes");

	// Test secondary can update own note
	await assertSucceeds(secondaryNoteRef.update({ body: "My updated note by secondary" }));
	logTest(13, "Secondary user can update their own note");

	const mainNoteRefFromSecondary = secondaryContext
		.firestore()
		.collection("members")
		.doc("fulanito")
		.collection("notes")
		.doc("main-note");

	// Test secondary should not update auth note
	await assertFails(
		mainNoteRefFromSecondary.update({
			body: "This is my note now by secondary",
		})
	);
	logTest(14, "Secondary user should not be able to update other user's note");

	// All test passed
	console.log(""); // empty line
	console.log(`\x1b[32mALL TESTS PASSED (${currentTest - 1})\x1b[0m`);
	await cleanup(0);
} catch (err) {
	console.log(`\x1b[31mTEST #${currentTest} FAILED:\x1b[0m`);
	console.log(err);
	await cleanup(1);
}
