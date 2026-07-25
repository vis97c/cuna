import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { TimedPromise } from "~~/functions-scrapper/src/utils/guards.ts";

import type { CookieOptions } from "#app";

interface Queue {
	id: string;
	message: string;
	completed: boolean;
	error?: Error;
}

interface QueueData<T> {
	data?: T;
	message: string;
}

const cookieOptionsDefaults = {
	sameSite: "strict",
	maxAge: 365 * 24 * 60 * 60, // 1 year
} satisfies CookieOptions;

/**
 * App store
 * Handle app state
 *
 * @state
 */
export const useAppStore = defineStore("app", () => {
	const { firebaseConfig, production } = useRuntimeConfig().public;
	const appPrefix = `app.${firebaseConfig.projectId}`;
	const cookieOptions = {
		...cookieOptionsDefaults,
		secure: production,
		partitioned: production,
	} satisfies CookieOptions;

	// State
	const maintenance = useState<boolean>(`${appPrefix}.maintenance`, () => false);
	/**
	 * Queue of tasks
	 *
	 * The user should be able to keep track of background tasks
	 */
	const queue = useState<Queue[]>(`${appPrefix}.queue`, () => []);
	/**
	 * Thumbs of images
	 *
	 * @cache Session only, fallback for file upload
	 */
	const thumbnails = ref<Record<string, string>>({});
	const tvMQRange = useState<boolean>("app.tvMQRange", () => false);
	const laptopMQRange = useState<boolean>("app.laptopMQRange", () => false);
	const tabletMQRange = useState<boolean>("app.tabletMQRange", () => false);
	const mobileMQRange = useState<boolean>("app.mobileMQRange", () => false);
	const smartwatchMQRange = useState<boolean>("app.smartwatchMQRange", () => false);
	/** Jump to next content automatically */
	const autoNextContent = useCookie<boolean>(`${appPrefix}.autoNextContent`, {
		...cookieOptions,
		default: () => true,
	});

	// Getters
	const activeQueue = computed(() => queue.value.filter((item) => !item.completed));

	// Actions
	/**
	 * Runs tasks in the background and displays a queue
	 * @param id Unique identifier of the task
	 * @param message Message to display
	 * @param toQueue Task to await
	 * @param minutes Max amount of minutes to wait
	 * @returns
	 */
	async function useQueue<T>(
		id: string,
		message: string,
		toQueue: () => Promise<string | { data: T; message: string }>,
		minutes = 5 // 5 minutes
	): Promise<{ error?: Error; data?: T }> {
		let error: Error | undefined;
		let data: T | undefined;

		try {
			// New queue item
			queue.value.push({ id, message, completed: false });
			// Limit queue time
			data = await TimedPromise(
				async (resolve, reject) => {
					try {
						// Mark task as completed once it resolves
						const message = await toQueue();
						const queued: QueueData<T> =
							typeof message === "string" ? { message } : message;
						const index = queue.value.findIndex((item) => item.id === id);

						if (queue.value[index]) {
							queue.value[index].message = queued.message;
							queue.value[index].completed = true;
						}

						// Return resolved data if any
						resolve(queued.data);
					} catch (err) {
						reject(err);
					}
				},
				{ timeout: 1000 * 60 * minutes }
			);
		} catch (err) {
			// Display error if queue is still active
			const index = queue.value.findIndex((item) => item.id === id);
			const errorMessage = typeof err === "string" ? err : "Hubo un error";

			error = err instanceof Error ? err : new Error(errorMessage);

			if (queue.value[index]) {
				queue.value[index].message = error.message;
				queue.value[index].completed = true;
				queue.value[index].error = error;
			}
		}

		// Remove from queue after 1 minute
		setTimeout(() => {
			queue.value = queue.value.filter((item) => item.id !== id);
		}, 1000 * 60);

		// Crash if any (Handle errors outside of task)
		return { error, data };
	}
	function clearQueue() {
		queue.value = [];
	}
	function setTvMQRange(newValue: boolean) {
		tvMQRange.value = newValue;
	}
	function setLaptopMQRange(newValue: boolean) {
		laptopMQRange.value = newValue;
	}
	function setTabletMQRange(newValue: boolean) {
		tabletMQRange.value = newValue;
	}
	function setMobileMQRange(newValue: boolean) {
		mobileMQRange.value = newValue;
	}
	function setSmartwatchMQRange(newValue: boolean) {
		smartwatchMQRange.value = newValue;
	}
	function saveThumbnail(path: string, file: File) {
		thumbnails.value[path] = URL.createObjectURL(file);
	}
	function setAutoNextContent(newValue: boolean) {
		autoNextContent.value = newValue;
	}

	const store = {
		// App, refs
		maintenance,
		queue,
		thumbnails,
		tvMQRange,
		laptopMQRange,
		tabletMQRange,
		mobileMQRange,
		smartwatchMQRange,
		autoNextContent,
		// App, computed
		activeQueue,
		// App, actions
		useQueue,
		clearQueue,
		setTvMQRange,
		setLaptopMQRange,
		setTabletMQRange,
		setMobileMQRange,
		setSmartwatchMQRange,
		saveThumbnail,
		setAutoNextContent,
	};

	return store;
});
