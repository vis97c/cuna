const path = require("node:path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	cacheDirectory: path.join(__dirname, ".cache", "puppeteer"),
};
