// Skip update in production and CI
if (process.env.NODE_ENV === "production" || process.env.CI === "true") process.exit(0);

const fs = require("fs");

/**
 * Syncs the firebase-nuxt version for firebase functions and legacy packages
 */
try {
	// Get firebase-nuxt version
	const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
	const firebaseNuxtVersion = packageJson.dependencies["@open-xamu-co/firebase-nuxt"];
	const uiCommonTypesVersion = packageJson.devDependencies["@open-xamu-co/ui-common-types"];
	// Get package.json for functions and functions-scrapper
	const functionsPackageJson = JSON.parse(fs.readFileSync("functions/package.json", "utf8"));
	const scrapperPackageJson = JSON.parse(
		fs.readFileSync("functions-scrapper/package.json", "utf8")
	);

	// Update version for functions and functions-scrapper
	functionsPackageJson.dependencies["@open-xamu-co/firebase-nuxt"] = firebaseNuxtVersion;
	functionsPackageJson.devDependencies["@open-xamu-co/ui-common-types"] = uiCommonTypesVersion;
	scrapperPackageJson.dependencies["@open-xamu-co/firebase-nuxt"] = firebaseNuxtVersion;
	scrapperPackageJson.devDependencies["@open-xamu-co/ui-common-types"] = uiCommonTypesVersion;

	// Rewrite files
	fs.writeFileSync("functions/package.json", JSON.stringify(functionsPackageJson, null, 2));
	fs.writeFileSync(
		"functions-scrapper/package.json",
		JSON.stringify(scrapperPackageJson, null, 2)
	);

	console.log(
		`Synced firebase-nuxt version ${firebaseNuxtVersion} for functions and functions-scrapper packages`
	);
} catch (err) {
	console.error(err);
	process.exit(1);
}

process.exit(0);
