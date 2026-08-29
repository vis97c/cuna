import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "firestore",
					include: ["tests/firebase/firestore.spec.ts"],
					environment: "node",
				},
			},
			{
				test: {
					name: "functions",
					include: ["tests/firebase/functions.spec.ts"],
					environment: "node",
				},
			},
		],
		globals: true,
	},
});
