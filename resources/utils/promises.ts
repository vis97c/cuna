export type tPromiseExecutor<T> = (
	resolve: (value: T | PromiseLike<T>) => void,
	reject: (reason?: any) => void
) => void;

/**
 * Fails promise if it takes too long
 *
 * @see https://ourcodeworld.com/articles/read/1544/how-to-implement-a-timeout-for-javascript-promises
 */
export function TimedPromise<T>(executor: tPromiseExecutor<T>, fallback?: T, timeoutSeconds = 30) {
	return Promise.race<T>([
		new Promise(executor),
		new Promise((resolve, reject) => {
			setTimeout(() => {
				if (fallback) {
					console.warn("Timed out with fallback");

					resolve(fallback);
				} else {
					reject("Timed out");
				}
			}, timeoutSeconds * 1000);
		}),
	]);
}
