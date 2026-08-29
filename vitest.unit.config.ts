import { defineVitestConfig } from "@nuxt/test-utils/config";

// Isolate unit tests definition
export default defineVitestConfig({
	test: {
		name: "unit",
		// Run component/integration tests in the Nuxt environment
		include: ["app/{**,**/**}/*.{test,spec}.ts"],
		environment: "nuxt",
		globals: true,
	},
});
