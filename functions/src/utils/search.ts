import words from "lodash-es/words.js";
import deburr from "lodash-es/deburr.js";

/**
 * Get alphanumeric words array
 */
export function getWords(phrase: string): string[] {
	return words(deburr(phrase.toUpperCase())).map((word) => word.replace(/[^a-z0-9]/gi, ""));
}

/**
 * Soundex algorithm in spanish
 *
 * Translated to ts by chatGPT an manually cleaned up
 * @see https://patotech.blogspot.com/2016/04/implementacion-algoritmo-soundex-para.html
 */
export function soundexEs(phrase: string): string {
	let tmp = phrase.replaceAll(" ", "");

	if (!tmp) return "";

	let firstLetter = tmp.charAt(0);
	let rest = tmp.slice(1);

	// Reemplazos iniciales
	firstLetter = firstLetter
		.replace(/[V]/, "B")
		.replace(/[ZX]/, "S")
		.replace(/[G](?=[EI])/, "J")
		.replace(/[C](?![HEI])/, "K");

	// Corrección de letras compuestas
	tmp = firstLetter + rest;
	tmp = tmp
		.replace(/CH/g, "V")
		.replace(/QU/g, "K")
		.replace(/LL/g, "J")
		.replace(/CE|CI/g, "S")
		.replace(/Y[AEIOU]/g, "J")
		.replace(/NY|NH/g, "N");

	// Algoritmo Soundex
	firstLetter = tmp.charAt(0);
	rest = tmp
		.slice(1)
		.replace(/[AEIOUHWY]/g, "")
		.replace(/[BPFV]/g, "1")
		.replace(/[CGKSXZ]/g, "2")
		.replace(/[DT]/g, "3")
		.replace(/[L]/g, "4")
		.replace(/[MN]/g, "5")
		.replace(/[R]/g, "6")
		.replace(/[QJ]/g, "7")
		.replace(/(\d)\1+/g, "$1");

	return (firstLetter + rest).padEnd(4, "0").slice(0, 4);
}

/**
 * Generate indexes to be used as tokens in a fuzzy search
 *
 * Indexes allow to search for a phrase in a fuzzy way
 *
 * @param phrase phrase to generate indexes for
 * @param soundexAlgorithm soundex algorithm to use
 * @returns array of indexes
 */
export function getSearchIndexes(
	phrase: string,
	soundexAlgorithm: (phrase: string) => string = soundexEs
): string[] {
	return getWeightedSearchIndexes(phrase, soundexAlgorithm).indexes;
}

/**
 * Generate indexes to be used as tokens in a fuzzy search
 *
 * Indexes allow to search for a phrase in a fuzzy way
 * Weights allow to sort results based on their relevance
 *
 * @param phrase phrase to generate indexes for
 * @param soundexAlgorithm soundex algorithm to use
 * @returns array of objects with index and weight
 */
export function getWeightedSearchIndexes(
	phrase: string,
	soundexAlgorithm: (phrase: string) => string = soundexEs
): { indexes: string[]; indexesWeights: string[] } {
	const words = getWords(phrase);
	const indexes = new Set<string>();
	/** Bigger the index less the relevance */
	const weights = new Set<string>();

	// Iterate over each word in the phrase
	for (let i = 0; i < words.length; i++) {
		// Generate the combinations of words from left to right
		const forwardWords = words.slice(0, words.length - i);
		// Generate the combinations of words from right to left
		const backwardWords = words.slice(i);

		// Iterate over each combination of words
		[forwardWords, backwardWords].forEach((currentWords) => {
			// Add the search index for the current phrase and word to the set
			const phraseIndex = soundexAlgorithm(currentWords.join(" "));

			indexes.add(phraseIndex);
			weights.add(`0:${phraseIndex}`);

			// Iterate over each word
			currentWords.forEach((word) => {
				// Add the search index for the current word to the set
				const wordIndex = soundexAlgorithm(word);

				indexes.add(wordIndex);
				weights.add(`1:${wordIndex}`);

				// Add additional indexes to the set for long words
				if (word.length >= 7) {
					const fiveIndex = soundexAlgorithm(word.slice(0, 5));
					const threeIndex = soundexAlgorithm(word.slice(0, 3));

					indexes.add(fiveIndex);
					weights.add(`2:${fiveIndex}`);

					indexes.add(threeIndex);
					weights.add(`3:${threeIndex}`);
				}
			});
		});
	}

	// Convert the set of indexes into an array
	return { indexes: Array.from(indexes), indexesWeights: Array.from(weights) };
}
