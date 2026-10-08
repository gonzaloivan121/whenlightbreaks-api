import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { UserTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const createUserSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(8),
    email: z.email().min(1),
    phone: z.e164().min(1),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(8).optional(),
    email: z.email().min(1).optional(),
    phone: z.e164().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

protectedApp.get("/", async (c) => {
    const users = await db
        .select()
        .from(UserTable)
        .orderBy(UserTable.createdAt);

    return c.json(users);
});

protectedApp.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [user] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, id));

    if (!user) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
});

protectedApp.get("/username/:username", async (c) => {
    const username = c.req.param("username");
    const users = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, username));

    return c.json(users);
});

protectedApp.get("/email/:email", async (c) => {
    const email = c.req.param("email");
    const users = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, email));

    return c.json(users);
});

protectedApp.post("/", sValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");

    const [existingUsernameUser] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, data.username));

    if (existingUsernameUser) {
        return c.json({ error: "Username not available" }, 400);
    }

    const [existingEmailUser] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, data.email));

    if (existingEmailUser) {
        return c.json({ error: "Email not available" }, 400);
    }

    const [user] = await db.insert(UserTable).values(data).returning();

    return c.json(user, 201);
});

protectedApp.put("/:id", sValidator("json", updateUserSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (data.username) {
        const [existingUsernameUser] = await db
            .select()
            .from(UserTable)
            .where(eq(UserTable.username, data.username));

        if (existingUsernameUser) {
            return c.json({ error: "Username not available" }, 400);
        }
    }

    if (data.email) {
        const [existingEmailUser] = await db
            .select()
            .from(UserTable)
            .where(eq(UserTable.email, data.email));

        if (existingEmailUser) {
            return c.json({ error: "Email not available" }, 400);
        }
    }

    const [user] = await db
        .update(UserTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(UserTable.id, id))
        .returning();

    if (!user) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(UserTable).where(eq(UserTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
