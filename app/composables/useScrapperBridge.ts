const LOCAL_AGENT_URL = "http://127.0.0.1:39123";

export function useScrapperBridge() {
	const isCheckingAgent = ref(true);
	const agentActive = ref(false);
	const agentOS = ref<string | null>(null);

	async function checkAgentHealth() {
		isCheckingAgent.value = true;

		try {
			const res = await fetch(`${LOCAL_AGENT_URL}/health`, {
				method: "GET",
				signal: AbortSignal.timeout(2000),
			});

			if (res.ok) {
				const data = await res.json();

				if (data.service === "cuna-desktop-agent") {
					agentActive.value = true;
					agentOS.value = data.os;
				}
			}
		} catch {
			agentActive.value = false;
			agentOS.value = null;
		} finally {
			isCheckingAgent.value = false;
		}
	}

	async function scrapeCoursesLocally(payload: {
		place: string;
		faculty: string;
		program: string;
		level?: string;
	}) {
		if (!agentActive.value) {
			throw new Error("Local scraper agent is not active");
		}

		const res = await fetch(`${LOCAL_AGENT_URL}/scrape-courses`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const err = await res.json();

			throw new Error(err.error || "Local scraping failed");
		}

		return await res.json();
	}

	onMounted(() => {
		checkAgentHealth();
	});

	return {
		isCheckingAgent,
		agentActive,
		agentOS,
		checkAgentHealth,
		scrapeCoursesLocally,
	};
}
