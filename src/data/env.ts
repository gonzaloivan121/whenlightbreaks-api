import "dotenv/config";
import z from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().min(1).default(3000),
    DB_HOST: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().min(1),
    JWT_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.message);
    process.exit(1);
}

/**
 * An interface that defines the exact environment variables available.
 *
 * @interface Env
 */
interface Env {
    /**
     * The port in which the application runs on.
     *
     * @type {number}
     * @memberof Env
     */
    PORT: number;

    /**
     * The host name of the database.
     *
     * @type {string}
     * @memberof Env
     */
    DB_HOST: string;

    /**
     * The name of the database.
     *
     * @type {string}
     * @memberof Env
     */
    DB_NAME: string;

    /**
     * The user name of the database.
     *
     * @type {string}
     * @memberof Env
     */
    DB_USER: string;

    /**
     * The password of the database.
     *
     * @type {string}
     * @memberof Env
     */
    DB_PASSWORD: string;

    /**
     * The port of the database.
     *
     * @type {number}
     * @memberof Env
     */
    DB_PORT: number;

    /**
     * The secret JSON Web Token for the application.
     *
     * @type {string}
     * @memberof Env
     */
    JWT_SECRET: string;
}

/**
 * The parsed environment data.
 * 
 * @type {Env}
 */
export const env: Env = parsed.data;
