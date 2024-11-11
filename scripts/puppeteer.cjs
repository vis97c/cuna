const { writeFile } = require("fs/promises");
const { join } = require("path");

/**
 * Puppeteer requirements
 *
 * Increase on memory & use of cache
 * @see https://stackoverflow.com/a/78926494/3304008
 * @see https://pptr.dev/troubleshooting#running-puppeteer-on-google-cloud-functions
 */
async function main() {
	const root = join(__dirname, "../.output/server");

	await writeFile(
		join(root, ".puppeteerrc.cjs"),
		`const { join } = require("path");module.exports = { cacheDirectory: join(__dirname, "node_modules", ".puppeteer_cache") };`
	);
}

main();
