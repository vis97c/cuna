const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function getPuppeteer(proxyServer) {
	const setup = {
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--disable-gpu",
		],
	};

	if (proxyServer) setup.args.push(`--proxy-server=${proxyServer}`);

	// Setup puppeteer
	const browser = await puppeteer.launch(setup);
	const page = await browser.newPage();

	/**
	 * Attempt to close everything
	 */
	async function cleanup() {
		try {
			await page.close();
		} catch (err) {
			console.error(err);
		}

		await browser.close();
	}

	return { browser, page, cleanup };
}

const siaDomain = "https://sia.unal.edu.co";
const siaPath = "/Catalogo/facespublico/public/servicioPublico.jsf";
const siaQuery = "?taskflowId=task-flow-AC_CatalogoAsignaturas";
const siaUrl = `${siaDomain}${siaPath}${siaQuery}`;

// Save proxies to file, test them with siaUrl
(async () => {
	try {
		const file = fs.readFileSync(path.join(__dirname, "../dist/proxies.json"), "utf-8");
		const proxyList = JSON.parse(file);
		// Initialize list with valid proxies
		const list = new Set();
		const pendingTasks = [];

		for (const { proxy, anonymity, times_dead, times_alive } of proxyList.proxies) {
			// Bypass undessired proxies
			// if (!countries.includes(ip_data.countryCode)) continue;
			if (anonymity === "transparent") continue;
			// Bypass if death more than 90%
			if (times_dead > times_alive * 0.9) continue;

			// Return task to be run on demand
			pendingTasks.push(async () => {
				const { page, cleanup } = await getPuppeteer(proxy);

				try {
					// Reject slow proxies, 30 seconds
					const response = await Promise.race([
						new Promise((_resolve, reject) => {
							setTimeout(() => reject(new Error("Timeout")), 1000 * 30);
						}),
						page.goto(siaUrl),
						// page.goto("https://status.search.google.com"),
					]);

					if (!response.ok()) throw new Error("Not ok");

					// Success
					list.add(proxy);
					console.log(`\x1b[32mServer ${proxy} is working\x1b[0m`);
				} catch (err) {
					console.log(`\x1b[31mServer ${proxy} is not working\x1b[0m`);
				}

				await cleanup();

				// Run next task
				return pendingTasks.pop()?.();
			});
		}

		console.log(`\x1b[32mTesting ${pendingTasks.length} proxies...\x1b[0m`);

		// Start with the first 10 tasks in parallel
		await Promise.allSettled(pendingTasks.slice(0, 10).map((task) => task()));

		const mappedProxies = { total: list.size, list: Array.from(list) };

		console.log(`\x1b[32m${list.size} proxies are working\x1b[0m`);

		// Write to new file or override existing
		fs.writeFileSync(
			path.join(__dirname, "../dist/results.json"),
			JSON.stringify(mappedProxies)
		);

		// Success
		console.log(`\x1b[32mProxies updated successfully\x1b[0m`);
	} catch (err) {
		/**
		 * Get proxy list from
		 * @see https://proxyscrape.com/free-proxy-list
		 * @see https://free-proxy-list.net/en/
		 * @see https://github.com/proxifly/free-proxy-list
		 * We recommend latam proxies, maybe spain as well
		 */
		console.error(err);
		console.log(`\x1b[31mGet your proxy list from any of the recommended sources\x1b[0m`);
	}

	return;
})();
