import { Hono } from "hono";
import { db } from "../db/db.ts";
import { ApiKeyTable } from "../db/schema.ts";
import { and, eq } from "drizzle-orm";
import { jwt } from "hono/jwt";
import { env } from "../data/env.ts";
import z from "zod";
import { sValidator } from "@hono/standard-validator";
import { generateApiKey } from "../lib/crypto.ts";

type JwtEnv = {
    Variables: {
        jwtPayload: {
            sub: string;
            email: string;
            exp: number;
        };
    };
};

const app = new Hono<JwtEnv>();

const createKeySchema = z.object({
    name: z.string().min(1).max(255),
});

app.use(jwt({ secret: env.JWT_SECRET, alg: "HS256" }));

app.get("/", async (c) => {
    const { sub: userId } = c.var.jwtPayload;

    const apiKeys = await db
        .select({
            id: ApiKeyTable.id,
            name: ApiKeyTable.name,
            keyPrefix: ApiKeyTable.keyPrefix,
            createdAt: ApiKeyTable.createdAt,
        })
        .from(ApiKeyTable)
        .where(eq(ApiKeyTable.userId, userId))
        .orderBy(ApiKeyTable.createdAt);

    return c.json(apiKeys);
});

app.post("/", sValidator("json", createKeySchema), async (c) => {
    const { sub: userId } = c.var.jwtPayload;
    const { name } = await c.req.valid("json");
    const { raw, hash, prefix } = await generateApiKey();

    const [apiKey] = await db
        .insert(ApiKeyTable)
        .values({
            name,
            userId,
            keyHash: hash,
            keyPrefix: prefix,
        })
        .returning({
            id: ApiKeyTable.id,
        });

    return c.json({ key: raw, id: apiKey.id }, 201);
});

app.delete("/:id", async (c) => {
    const { sub: userId } = c.var.jwtPayload;
    const id = c.req.param("id");

    await db
        .delete(ApiKeyTable)
        .where(and(eq(ApiKeyTable.id, id), eq(ApiKeyTable.userId, userId)));

    return c.body(null, 204);
});

export default app;
