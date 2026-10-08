import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { SocialLinkTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createSocialLinkSchema = z.object({
    label: z.string().min(1),
    icon: z.string().min(1),
    url: z.string().min(1),
});

const updateSocialLinkSchema = z.object({
    label: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const socialLinks = await db
        .select()
        .from(SocialLinkTable)
        .orderBy(SocialLinkTable.createdAt);

    return c.json(socialLinks);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [socialLink] = await db
        .select()
        .from(SocialLinkTable)
        .where(eq(SocialLinkTable.id, id));

    if (!socialLink) {
        return c.json({ error: "Social Link not found" }, 404);
    }

    return c.json(socialLink);
});

protectedApp.post("/", sValidator("json", createSocialLinkSchema), async (c) => {
    const data = c.req.valid("json");
    const [socialLink] = await db
        .insert(SocialLinkTable)
        .values(data)
        .returning();

    return c.json(socialLink, 201);
});

protectedApp.put("/:id", sValidator("json", updateSocialLinkSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [socialLink] = await db
        .update(SocialLinkTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(SocialLinkTable.id, id))
        .returning();

    if (!socialLink) {
        return c.json({ error: "Social Link not found" }, 404);
    }

    return c.json(socialLink);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(SocialLinkTable).where(eq(SocialLinkTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;