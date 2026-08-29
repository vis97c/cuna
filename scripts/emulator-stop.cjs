const { execSync } = require("child_process");

// Skip emulator shutdown on Linux/Unix CI environments, only run on Windows local environments
if (process.platform === "win32" && !process.env.CI) {
	try {
		console.log("Shutting down emulator shutdown endpoint (Windows workaround)...");
		execSync("curl -d '' localhost:8080/shutdown", { stdio: "inherit" });
	} catch {
		// Ignore shutdown errors if emulator is already stopped
	}
}

process.exit(0);
