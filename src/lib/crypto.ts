import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * An interface that represents an API key's data.
 *
 * @export
 * @interface ApiKey
 */
export interface ApiKey {
    /**
     * The raw API key.
     *
     * @type {string}
     * @memberof ApiKey
     */
    raw: string;

    /**
     * The hash of the API key.
     *
     * @type {string}
     * @memberof ApiKey
     */
    hash: string;

    /**
     * The prefix of the API key.
     *
     * @type {string}
     * @memberof ApiKey
     */
    prefix: string;
}

/**
 * Hashes a password using the scrypt algorithm.
 *
 * @export
 * @param {string} password - The plain text password to hash.
 * @returns {Promise<string>} A promise that resolves with the hashed password in the format `salt:hex`.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt: string = randomBytes(16).toString("hex");
    const hash = await scryptAsync(password, salt);

    return `${salt}:${hash.toString("hex")}`;
}

/**
 * Verifies that a plain text password matches a stored hash using `timingSafeEqual` 
 * to prevent timing attacks.
 *
 * @export
 * @param {string} password - The plain text password to verify.
 * @param {string} storedHash - The stored hash to verify the password against (expected format `salt:hex`).
 * @returns {Promise<boolean>} A promise that resolves with `true` if the password matches, `false` otherwise.
 */
export async function verifyPassword(
    password: string,
    storedHash: string,
): Promise<boolean> {
    const [salt, hashHex] = storedHash.split(":");
    const stored = Buffer.from(hashHex, "hex");
    const derived = await scryptAsync(password, salt);

    return timingSafeEqual(stored, derived);
}

/**
 * Generates a random cryptographic token of the specified length.
 *
 * @export
 * @param {number} [length=32] - The number of bytes to generate (defaults to 32).
 * @returns {Promise<string>} A promise that resolves with a hexadecimal string representation of the token.
 */
export async function randomToken(length: number = 32): Promise<string> {
    return randomBytes(length).toString("hex");
}

/**
 * Generates a new API key, consisting of a raw key, its hashed version, and a safe prefix.
 *
 * @export
 * @returns {Promise<ApiKey>} A promise that resolves with an `ApiKey` object containing the raw key, hash, and prefix.
 */
export async function generateApiKey(): Promise<ApiKey> {
    const raw = randomBytes(32).toString("base64");
    const hash = await hashApiKey(raw);
    const prefix = raw.slice(0, 8);

    return { raw, hash, prefix };
}

/**
 * Hashes a raw API key using the SHA-256 algorithm.
 *
 * @export
 * @param {string} raw - The raw API key string to hash.
 * @returns {Promise<string>} A promise that resolves with the hexadecimal string of the SHA-256 hash.
 */
export async function hashApiKey(raw: string): Promise<string> {
    return createHash("sha256").update(raw).digest("hex");
}

/**
 * A Promise wrapper around Node's asynchronous `crypto.scrypt` function.
 *
 * @param {string} password - The plain text password to derive a key for.
 * @param {string} salt - The salt to use in the derivation process.
 * @returns {Promise<Buffer<ArrayBuffer>>} A promise that resolves with the derived key as a Buffer.
 */
async function scryptAsync(password: string, salt: string): Promise<Buffer<ArrayBuffer>> {
    return new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) {
                return reject(err);
            }

            resolve(derivedKey);
        });
    });
}