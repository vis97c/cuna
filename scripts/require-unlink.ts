import process from "node:process";
import fs from "node:fs";

const main = () => {
	const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
	const resolutionsValues = Object.values(packageJson.resolutions ?? {});

	if (resolutionsValues.find((entry: any) => entry.includes("portal:/"))) {
		console.debug("package.json contains portals. Run `yarn unlink` before committing.");
		process.exit(1);
	}

	process.exit(0);
};

main();
