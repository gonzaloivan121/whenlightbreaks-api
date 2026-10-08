import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { UserTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/crypto.ts";
import { sign } from "hono/jwt";
import { env } from "../data/env.ts";

const JWT_EXPIRATION_SECONDS = 60 * 60; // 1 hour

const registerSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(8),
    email: z.email().min(1),
    phone: z.e164().min(1),
});

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const app = new Hono();

app.post("/register", sValidator("json", registerSchema), async (c) => {
    const newUser = c.req.valid("json");

    const [existingUsername] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, newUser.username));

    if (existingUsername) {
        return c.json({ error: "Username already in use" }, 409);
    }

    const [existingUserEmail] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.email, newUser.email));

    if (existingUserEmail) {
        return c.json({ error: "Email already in use" }, 409);
    }

    const passwordHash = await hashPassword(newUser.password);
    newUser.password = passwordHash;

    const [user] = await db.insert(UserTable).values(newUser).returning({
        id: UserTable.id,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
        username: UserTable.username,
        email: UserTable.email,
        phone: UserTable.phone,
        role: UserTable.role,
        createdAt: UserTable.createdAt,
        updatedAt: UserTable.updatedAt,
    });

    return c.json(user, 201);
});

app.post("/login", sValidator("json", loginSchema), async (c) => {
    const { username, password } = c.req.valid("json");
    const [user] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, username));

    if (!user) {
        return c.json({ error: "Invalid username or password" }, 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
        return c.json({ error: "Invalid username or password" }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await sign({
        exp: now + JWT_EXPIRATION_SECONDS,
        sub: user.id,
        email: user.email,
    }, env.JWT_SECRET, "HS256");

    return c.json({ token });
});

export default app;
