const fs = require("fs");

/**
 * Firebase App Hosting requires the package.json to have a start script
 *
 * @see https://github.com/nitrojs/nitro/issues/3325
 */

try {
	// Copy .env to functions if exist
	if (fs.existsSync(".env")) {
		fs.copyFileSync(".env", "functions/.env");
		fs.copyFileSync(".env", "functions-scrapper/.env");
		console.log("copied .env to functions");
	}

	// Read package.json & add start command if exist
	if (fs.existsSync(".output/server/package.json")) {
		const packageJson = JSON.parse(fs.readFileSync(".output/server/package.json", "utf8"));

		// Set startup command
		packageJson.scripts = packageJson.scripts || {};
		packageJson.scripts.start = "node index.mjs";

		// Copy .env to server if exist
		if (fs.existsSync(".env")) {
			fs.copyFileSync(".env", ".output/server/.env");
			console.log("copied .env to server");
		}

		// Write package.json
		fs.writeFileSync(".output/server/package.json", JSON.stringify(packageJson, null, 2));
	}
} catch (err) {
	console.error(err);
	process.exit(1);
}

process.exit(0);
