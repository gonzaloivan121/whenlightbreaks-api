import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { AlbumTable, ArtistTable, SongTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createSongSchema = z.object({
    title: z.string().min(1),
    coverUrl: z.string().min(1),
    songUrl: z.string().min(1),
    albumId: z.uuid().min(1),
    artistId: z.uuid().min(1),
});

const updateSongSchema = z.object({
    title: z.string().min(1).optional(),
    coverUrl: z.string().min(1).optional(),
    songUrl: z.string().min(1).optional(),
    albumId: z.uuid().min(1).optional(),
    artistId: z.uuid().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const songs = await db
        .select()
        .from(SongTable)
        .orderBy(SongTable.createdAt);

    return c.json(songs);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [song] = await db
        .select()
        .from(SongTable)
        .where(eq(SongTable.id, id));

    if (!song) {
        return c.json({ error: "Song not found" }, 404);
    }

    return c.json(song);
});

app.get("/album/:albumId", async (c) => {
    const albumId = c.req.param("albumId");
    const songs = await db
        .select()
        .from(SongTable)
        .where(eq(SongTable.albumId, albumId))
        .orderBy(SongTable.createdAt);

    return c.json(songs);
});

app.get("/artist/:artistId", async (c) => {
    const artistId = c.req.param("artistId");
    const songs = await db
        .select()
        .from(SongTable)
        .where(eq(SongTable.artistId, artistId))
        .orderBy(SongTable.createdAt);

    return c.json(songs);
});

protectedApp.post("/", sValidator("json", createSongSchema), async (c) => {
    const data = c.req.valid("json");

    const [album] = await db
        .select()
        .from(AlbumTable)
        .where(eq(AlbumTable.id, data.albumId));

    if (!album) {
        return c.json({ error: "Album not found" }, 400);
    }

    const [artist] = await db
        .select()
        .from(ArtistTable)
        .where(eq(ArtistTable.id, data.artistId));

    if (!artist) {
        return c.json({ error: "Artist not found" }, 400);
    }

    const [song] = await db.insert(SongTable).values(data).returning();

    return c.json(song, 201);
});

protectedApp.put("/:id", sValidator("json", updateSongSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (data.albumId) {
        const [album] = await db
            .select()
            .from(AlbumTable)
            .where(eq(AlbumTable.id, data.albumId));

        if (!album) {
            return c.json({ error: "Album not found" }, 400);
        }
    }

    if (data.artistId) {
        const [artist] = await db
            .select()
            .from(ArtistTable)
            .where(eq(ArtistTable.id, data.artistId));

        if (!artist) {
            return c.json({ error: "Artist not found" }, 400);
        }
    }

    const [song] = await db
        .update(SongTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(SongTable.id, id))
        .returning();

    if (!song) {
        return c.json({ error: "Song not found" }, 404);
    }

    return c.json(song);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(SongTable).where(eq(SongTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;