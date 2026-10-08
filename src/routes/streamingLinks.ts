import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { StreamingLinkTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createStreamingLinkSchema = z.object({
    label: z.string().min(1),
    icon: z.string().min(1),
    url: z.string().min(1),
});

const updateStreamingLinkSchema = z.object({
    label: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const streamingLinks = await db
        .select()
        .from(StreamingLinkTable)
        .orderBy(StreamingLinkTable.createdAt);

    return c.json(streamingLinks);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [streamingLink] = await db
        .select()
        .from(StreamingLinkTable)
        .where(eq(StreamingLinkTable.id, id));

    if (!streamingLink) {
        return c.json({ error: "Streaming Link not found" }, 404);
    }

    return c.json(streamingLink);
});

protectedApp.post("/", sValidator("json", createStreamingLinkSchema), async (c) => {
    const data = c.req.valid("json");
    const [streamingLink] = await db
        .insert(StreamingLinkTable)
        .values(data)
        .returning();

    return c.json(streamingLink, 201);
});

protectedApp.put("/:id", sValidator("json", updateStreamingLinkSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [streamingLink] = await db
        .update(StreamingLinkTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(StreamingLinkTable.id, id))
        .returning();

    if (!streamingLink) {
        return c.json({ error: "Streaming Link not found" }, 404);
    }

    return c.json(streamingLink);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(StreamingLinkTable).where(eq(StreamingLinkTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
