import { env } from "../data/env.ts";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations.ts";

export const db = drizzle({
    relations,
    connection: {
        host: env.DB_HOST,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
    },
})