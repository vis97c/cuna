/// <reference lib="deno.ns" />
console.log("Building Cuna Desktop binaries for Windows, Linux, and macOS...");

try {
	await Deno.mkdir("dist", { recursive: true });
} catch {
	// directory exists
}

const targets = [
	{
		name: "Windows (x64)",
		target: "x86_64-pc-windows-msvc",
		output: "dist/cuna-desktop-windows-x64.exe",
	},
	{
		name: "Linux (x64)",
		target: "x86_64-unknown-linux-gnu",
		output: "dist/cuna-desktop-linux-x64",
	},
	{
		name: "macOS (Apple Silicon)",
		target: "aarch64-apple-darwin",
		output: "dist/cuna-desktop-macos-arm64",
	},
	{ name: "macOS (Intel)", target: "x86_64-apple-darwin", output: "dist/cuna-desktop-macos-x64" },
];

for (const t of targets) {
	console.log(`\nCompiling target ${t.name}...`);

	const cmd = new Deno.Command("deno", {
		args: [
			"compile",
			"--allow-net",
			"--allow-run",
			"--allow-read",
			"--allow-env",
			"--allow-sys",
			"--target",
			t.target,
			"--output",
			t.output,
			"../desktop.ts",
		],
	});

	const { success, stderr } = await cmd.output();

	if (success) {
		console.log(`Successfully compiled: ${t.output}`);
	} else {
		console.error(`Failed to compile ${t.name}:`, new TextDecoder().decode(stderr));
	}
}

console.log("\nAll binary compilation tasks finished!");
