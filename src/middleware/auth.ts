import { createMiddleware } from "hono/factory";
import { ApiKeyTable, UserTable } from "../db/schema.ts";
import { hashApiKey } from "../lib/crypto.ts";
import { eq } from "drizzle-orm";
import { db } from "../db/db.ts";

export type ApiKeyEnv = {
    Variables: {
        apiKeyUser: Pick<typeof UserTable.$inferSelect, "id" | "role" | "email">;
    };
};

export const apiKeyAuth = createMiddleware<ApiKeyEnv>(async (c, next) => {
    const key = c.req.header("X-API-Key");

    if (!key || key.length === 0 || key.trim() === "") {
        return c.json({ error: "API key required" }, 401);
    }

    const keyHash = await hashApiKey(key);
    const [apiKey] = await db
        .select()
        .from(ApiKeyTable)
        .where(eq(ApiKeyTable.keyHash, keyHash))

    if (!apiKey) {
        return c.json({ error: "Invalid API key" }, 401);
    }

    const [user] = await db
        .select({
            id: UserTable.id,
            role: UserTable.role,
            email: UserTable.email,
        })
        .from(UserTable)
        .where(eq(UserTable.id, apiKey.userId));

    if (!user) {
        return c.json({ error: "Invalid API key" }, 401);
    }

    c.set("apiKeyUser", user);

    await next();
});
