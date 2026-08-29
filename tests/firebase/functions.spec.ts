// @vitest-environment node
import { deleteApp, getApps } from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";
import { describe, it, beforeAll, afterAll, expect } from "vitest";

import { getFirebase } from "../../functions/src/utils/firebase.js";

const FUNCTIONS_TIMEOUT = 15000;

async function waitFor<T>(
	fn: () => Promise<T>,
	predicate: (val: T) => boolean,
	timeoutMs = FUNCTIONS_TIMEOUT,
	intervalMs = 200
): Promise<T> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		await new Promise((resolve) => setTimeout(resolve, intervalMs));

		try {
			const res = await fn();

			if (predicate(res)) return res;
		} catch (err) {
			// ignore polling errors
		}
	}

	const finalRes = await fn();

	if (predicate(finalRes)) return finalRes;

	throw new Error(`waitFor condition timed out after ${timeoutMs}ms`);
}

describe.concurrent(
	"Cloud Functions Background Triggers",
	{ timeout: 8 * FUNCTIONS_TIMEOUT },
	() => {
		let db: Firestore;

		beforeAll(async () => {
			process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
			process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

			db = getFirebase("test:functions").firebaseFirestore;
		});

		afterAll(async () => {
			for (const app of getApps()) {
				await deleteApp(app);
			}
		});

		describe("Log Triggers (onCreatedLog)", { timeout: FUNCTIONS_TIMEOUT }, () => {
			it("onCreatedLog: Automatically attaches createdAt/updatedAt timestamps to logs", async () => {
				const logRef = db.doc("logs/log_test_cuna_create");

				await logRef.set({ message: "Test log event cuna" });

				const logData = await waitFor(
					async () => (await logRef.get()).data(),
					(data) => !!(data?.createdAt && data?.updatedAt)
				);

				expect(logData?.createdAt).toBeDefined();
				expect(logData?.updatedAt).toBeDefined();
				expect(logData?.internal).toBe(false);
			});
		});

		describe("Instance Triggers (onCreatedInstance)", { timeout: FUNCTIONS_TIMEOUT }, () => {
			it("onCreatedInstance: Populates defaults and slug when an instance is created", async () => {
				const instanceRef = db.doc("instances/test_cuna_create");

				await instanceRef.set({ name: "Universidad Nacional de Colombia" });

				const instanceData = await waitFor(
					async () => (await instanceRef.get()).data(),
					(data) => !!(data?.createdAt && data?.slug)
				);

				expect(instanceData?.slug).toBe("universidad-nacional-de-colombia");
				expect(instanceData?.locationCountry).toBe("CO");
			});
		});
	}
);
