import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Hashes a password using scrypt.
 *
 * @export
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = await scryptAsync(password, salt);

    return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hashHex] = storedHash.split(":");
    const stored = Buffer.from(hashHex, "hex");
    const derived = await scryptAsync(password, salt);

    return timingSafeEqual(stored, derived);
}

export async function randomToken(length: number = 32): Promise<string> {
    return randomBytes(length).toString("hex");
}

export async function generateApiKey(): Promise<{ raw: string; hash: string; prefix: string }> {
    const raw = randomBytes(32).toString("base64");
    const hash = await hashApiKey(raw);
    const prefix = raw.slice(0, 8);

    return { raw, hash, prefix };
}

export async function hashApiKey(raw: string): Promise<string> {
    return createHash("sha256").update(raw).digest("hex");
}

async function scryptAsync(password: string, salt: string): Promise<Buffer<ArrayBuffer>> {
    return new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey);
        });
    });
}