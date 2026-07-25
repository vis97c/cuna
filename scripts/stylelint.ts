import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

function getIgnoredPaths() {
	const ignoreFilePath = path.join(process.cwd(), ".prettierignore");

	if (!fs.existsSync(ignoreFilePath)) return [];

	return fs
		.readFileSync(ignoreFilePath, "utf-8")
		.split("\n")
		.map((line) => path.join(line.trim()))
		.filter((line) => line && !line.startsWith("#") && !line.includes("*")); // Filter out comments and empty lines
}

function findFiles(dir: string, ext: string, ignoredPaths: string[]) {
	let results: string[] = [];
	const list = fs.readdirSync(dir);

	list.forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);

		if (ignoredPaths.some((ignored) => filePath.includes(ignored))) return;

		if (stat && stat.isDirectory()) {
			results = results.concat(findFiles(filePath, ext, ignoredPaths));
		} else if (filePath.endsWith(ext)) {
			results.push(filePath);
		}
	});

	return results;
}

function runStylelintInBatches(files: string[], batchSize = 50) {
	const promises: Promise<string>[] = [];

	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		const promise = new Promise<string>((resolve, reject) => {
			const command = `stylelint --ignore-path .prettierignore --aei ${batch.join(" ")}`;

			exec(command, (error, stdout, stderr) => {
				if (error) reject(stderr);
				else resolve(stdout);
			});
		});

		promises.push(promise);
	}

	return Promise.allSettled(promises);
}

try {
	const startTime = performance.now(); // Start time measurement
	const ignoredPaths = getIgnoredPaths();
	const vueFiles = findFiles(".", ".vue", ignoredPaths);
	const scssFiles = findFiles(".", ".scss", ignoredPaths);
	const files = [...vueFiles, ...scssFiles];

	if (files.length > 0) {
		try {
			runStylelintInBatches(files).then(() => {
				const endTime = performance.now(); // End time measurement
				const seconds = ((endTime - startTime) / 1000).toFixed(2);

				console.log(`Stylelint completed in ${seconds} seconds`);
			});
		} catch (err) {
			console.error(err);
		}
	}
} catch (err) {
	if (err instanceof Error) console.error(err.message);
	else console.error("Unknown error");
}
