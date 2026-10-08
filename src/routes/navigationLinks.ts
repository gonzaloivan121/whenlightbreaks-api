import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { NavigationLinkTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createNavigationLinkSchema = z.object({
    label: z.string().min(1),
    icon: z.string().min(1),
    url: z.string().min(1),
});

const updateNavigationLinkSchema = z.object({
    label: z.string().min(1).optional(),
    icon: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const navigationLinks = await db
        .select()
        .from(NavigationLinkTable)
        .orderBy(NavigationLinkTable.createdAt);

    return c.json(navigationLinks);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [navigationLink] = await db
        .select()
        .from(NavigationLinkTable)
        .where(eq(NavigationLinkTable.id, id));

    if (!navigationLink) {
        return c.json({ error: "Navigation Link not found" }, 404);
    }

    return c.json(navigationLink);
});

protectedApp.post("/", sValidator("json", createNavigationLinkSchema), async (c) => {
    const data = c.req.valid("json");
    const [navigationLink] = await db
        .insert(NavigationLinkTable)
        .values(data)
        .returning();

    return c.json(navigationLink, 201);
});

protectedApp.put("/:id", sValidator("json", updateNavigationLinkSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [navigationLink] = await db
        .update(NavigationLinkTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(NavigationLinkTable.id, id))
        .returning();

    if (!navigationLink) {
        return c.json({ error: "Navigation Link not found" }, 404);
    }

    return c.json(navigationLink);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(NavigationLinkTable).where(eq(NavigationLinkTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
