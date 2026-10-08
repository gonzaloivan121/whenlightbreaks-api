import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { ArtistTable, concertStatusEnum, ConcertTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createConcertSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    venue: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    directionsUrl: z.string().min(1),
    date: z.date().min(1),
    status: z.enum(concertStatusEnum.enumValues),
    ticketsUrl: z.string().min(1),
    artistId: z.uuid().min(1),
});

const updateConcertSchema = z.object({
    title: z.string().min(1).optional(),
    subtitle: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    directionsUrl: z.string().min(1).optional(),
    date: z.date().min(1).optional(),
    status: z.enum(concertStatusEnum.enumValues).optional(),
    ticketsUrl: z.string().min(1).optional(),
    artistId: z.uuid().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const concerts = await db
        .select()
        .from(ConcertTable)
        .orderBy(ConcertTable.createdAt);

    return c.json(concerts);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [concert] = await db
        .select()
        .from(ConcertTable)
        .where(eq(ConcertTable.id, id));

    if (!concert) {
        return c.json({ error: "Concert not found" }, 404);
    }

    return c.json(concert);
});

app.get("/artist/:artistId", async (c) => {
    const artistId = c.req.param("artistId");
    const concerts = await db
        .select()
        .from(ConcertTable)
        .where(eq(ConcertTable.artistId, artistId))
        .orderBy(ConcertTable.createdAt);

    return c.json(concerts);
});

protectedApp.post("/", sValidator("json", createConcertSchema), async (c) => {
    const data = c.req.valid("json");

    const [artist] = await db
        .select()
        .from(ArtistTable)
        .where(eq(ArtistTable.id, data.artistId));

    if (!artist) {
        return c.json({ error: "Artist not found" }, 400);
    }

    const [concert] = await db.insert(ConcertTable).values(data).returning();

    return c.json(concert, 201);
});

protectedApp.put("/:id", sValidator("json", updateConcertSchema), async (c) => {
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

    const [concert] = await db
        .update(ConcertTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ConcertTable.id, id))
        .returning();

    if (!concert) {
        return c.json({ error: "Concert not found" }, 404);
    }

    return c.json(concert);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(ConcertTable).where(eq(ConcertTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
