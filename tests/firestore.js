import fs from "node:fs";
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc } from "firebase/firestore";

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
	const authContext = testEnv.authenticatedContext("fulanito", {});
	const guestContext = testEnv.unauthenticatedContext();
	// Set user
	const authUsersRef = authContext.firestore().collection("users");
	const authUserRef = authUsersRef.doc("fulanito");

	// Test auth context user write
	await assertSucceeds(setDoc(authUserRef, { name: "Fulanito", uid: "fulanito" }));
	logTest(1, "Created user with uid fulanito");
	await assertFails(authUsersRef.get());
	logTest(2, "Auth user cannot get a list of users");

	// Set instance (sudo), normally this should be done via admin-sdk
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const sudoInstanceRef = context.firestore().doc("instances/live");

		await assertSucceeds(setDoc(sudoInstanceRef, { name: "live" }));
		logTest(3, "Created instance as admin with id live");
	});

	const authInstancesRef = authContext.firestore().collection("instances");
	const authInstanceRef = authInstancesRef.doc("live");

	// Test auth context, get instance
	await assertSucceeds(authInstanceRef.get());
	logTest(4, "Auth user can get an instance");

	const authInstanceMembersRef = authInstanceRef.collection("members");
	const authInstanceMemberRef = authInstanceMembersRef.doc("fulanito");

	// Test auth context, set privileges
	await assertSucceeds(setDoc(authInstanceMemberRef, { userRef: authUserRef, role: -1 }));
	logTest(5, "Created instance member with id fulanito");
	await assertSucceeds(authUsersRef.get());
	logTest(6, "Auth user should now get a list of users");

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
	await assertSucceeds(setDoc(guestLogRef, { message: "error", lock: false }));
	logTest(9, "Guest user can write a log");
	await assertFails(guestLogsRef.get());
	logTest(10, "Guest user cannot read a log");

	// Remove an error log
	const authLogsRef = authContext.firestore().collection("logs");
	const authLogRef = authLogsRef.doc("error");

	// Test auth context log delete
	await assertSucceeds(authLogRef.delete());
	logTest(11, "Auth user can delete a log");

	// All test passed
	console.log(""); // empty line
	console.log(`\x1b[32mALL TESTS PASSED (${currentTest - 1})\x1b[0m`);
	await cleanup(0);
} catch (err) {
	console.log(`\x1b[31mTEST #${currentTest} FAILED:\x1b[0m`);
	console.log(err);
	await cleanup(1);
}
