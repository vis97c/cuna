import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encrypts a given text using AES-256-CBC algorithm.
 *
 * This function takes in a text to be encrypted and an encryption key.
 * It generates a random initialization vector (IV) and uses it along with the key to create a cipher.
 * The text is then encrypted using the cipher and the encrypted text is concatenated with the IV.
 *
 * @param {string} text - The text to be encrypted.
 * @param {string} key - The encryption key.
 * @returns {string} The encrypted text, concatenated with the initialization vector.
 */
export function encrypt(text: string, key: string) {
	const iv = randomBytes(16); // For AES, this is always 16
	const cipher = createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0")), iv);
	let encrypted = cipher.update(text);

	encrypted = Buffer.concat([encrypted, cipher.final()]);

	return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypts a given encrypted text using AES-256-CBC algorithm.
 *
 * This function takes in an encrypted text and an encryption key.
 * It splits the encrypted text into the initialization vector (IV) and the actual encrypted text.
 * It then uses the IV and the key to create a decipher and decrypts the text.
 *
 * @param {string} text - The encrypted text to be decrypted.
 * @param {string} key - The encryption key.
 * @returns {string} The decrypted text.
 */
export function decrypt(text: string, key: string | number) {
	const parts = text.split(":");
	const iv = Buffer.from(parts.shift()!, "hex");
	const encryptedText = Buffer.from(parts.join(":"), "hex");
	const decipher = createDecipheriv("aes-256-cbc", Buffer.from(String(key).padEnd(32, "0")), iv);
	let decrypted = decipher.update(encryptedText);

	decrypted = Buffer.concat([decrypted, decipher.final()]);

	return decrypted.toString();
}
