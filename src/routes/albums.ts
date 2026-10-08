import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { AlbumTable, ArtistTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createAlbumSchema = z.object({
    title: z.string().min(1),
    coverUrl: z.string().min(1),
    albumUrl: z.string().min(1),
    artistId: z.uuid().min(1),
});

const updateAlbumSchema = z.object({
    title: z.string().min(1).optional(),
    coverUrl: z.string().min(1).optional(),
    albumUrl: z.string().min(1).optional(),
    artistId: z.uuid().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const albums = await db
        .select()
        .from(AlbumTable)
        .orderBy(AlbumTable.createdAt);

    return c.json(albums);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [album] = await db
        .select()
        .from(AlbumTable)
        .where(eq(AlbumTable.id, id));

    if (!album) {
        return c.json({ error: "Album not found" }, 404);
    }

    return c.json(album);
});

app.get("/artist/:artistId", async (c) => {
    const artistId = c.req.param("artistId");
    const albums = await db
        .select()
        .from(AlbumTable)
        .where(eq(AlbumTable.artistId, artistId))
        .orderBy(AlbumTable.createdAt);

    return c.json(albums);
});

protectedApp.post("/", sValidator("json", createAlbumSchema), async (c) => {
    const data = c.req.valid("json");

    const [artist] = await db
        .select()
        .from(ArtistTable)
        .where(eq(ArtistTable.id, data.artistId));

    if (!artist) {
        return c.json({ error: "Artist not found" }, 400);
    }

    const [album] = await db.insert(AlbumTable).values(data).returning();

    return c.json(album, 201);
});

protectedApp.put("/:id", sValidator("json", updateAlbumSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (data.artistId) {
        const [artist] = await db
            .select()
            .from(ArtistTable)
            .where(eq(ArtistTable.id, data.artistId));

        if (!artist) {
            return c.json({ error: "Artist not found" }, 400);
        }
    }

    const [album] = await db
        .update(AlbumTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(AlbumTable.id, id))
        .returning();

    if (!album) {
        return c.json({ error: "Album not found" }, 404);
    }

    return c.json(album);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(AlbumTable).where(eq(AlbumTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
