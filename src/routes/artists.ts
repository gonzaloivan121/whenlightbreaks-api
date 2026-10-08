import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { ArtistTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createArtistSchema = z.object({
    name: z.string().min(1),
    artistUrl: z.string().min(1),
    pictureUrl: z.string().min(1),
});

const updateArtistSchema = z.object({
    name: z.string().min(1).optional(),
    artistUrl: z.string().min(1).optional(),
    pictureUrl: z.string().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const artists = await db
        .select()
        .from(ArtistTable)
        .orderBy(ArtistTable.createdAt);

    return c.json(artists);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [artist] = await db
        .select()
        .from(ArtistTable)
        .where(eq(ArtistTable.id, id));

    if (!artist) {
        return c.json({ error: "Artist not found" }, 404);
    }

    return c.json(artist);
});

protectedApp.post("/", sValidator("json", createArtistSchema), async (c) => {
    const data = c.req.valid("json");
    const [artist] = await db.insert(ArtistTable).values(data).returning();

    return c.json(artist, 201);
});

protectedApp.put("/:id", sValidator("json", updateArtistSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [artist] = await db
        .update(ArtistTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ArtistTable.id, id))
        .returning();

    if (!artist) {
        return c.json({ error: "Artist not found" }, 404);
    }

    return c.json(artist);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(ArtistTable).where(eq(ArtistTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;