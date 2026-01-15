const fs = require("fs");

/**
 * Firebase App Hosting requires the package.json to have a start script
 *
 * @see https://github.com/nitrojs/nitro/issues/3325
 */

try {
	// Read package.json
	const packageJson = JSON.parse(fs.readFileSync(".output/server/package.json", "utf8"));

	// Set startup command
	packageJson.scripts = packageJson.scripts || {};
	packageJson.scripts.start = "node index.mjs";

	// Read a .env if exist and copy it to the server path
	if (fs.existsSync(".env")) fs.copyFileSync(".env", ".output/server/.env");

	// Write package.json
	fs.writeFileSync(".output/server/package.json", JSON.stringify(packageJson, null, 2));
} catch (err) {
	console.error(err);
	process.exit(1);
}

process.exit(0);
