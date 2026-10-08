import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { orderStatusEnum, OrderTable, UserTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const amountSchema = z
    .string()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/)
    .refine((price) => /[1-9]/.test(price), {
        error: "Amount must be greater than zero",
    });

const createOrderSchema = z.object({
    amount: amountSchema,
    status: z.enum(orderStatusEnum.enumValues),
    userId: z.uuid().min(1),
});

const updateOrderSchema = z.object({
    amount: amountSchema.optional(),
    status: z.enum(orderStatusEnum.enumValues).optional(),
    userId: z.uuid().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const orders = await db
        .select()
        .from(OrderTable)
        .orderBy(OrderTable.createdAt);

    return c.json(orders);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [order] = await db
        .select()
        .from(OrderTable)
        .where(eq(OrderTable.id, id));

    if (!order) {
        return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order);
});

app.get("/user/:userId", async (c) => {
    const userId = c.req.param("userId");
    const orders = await db
        .select()
        .from(OrderTable)
        .where(eq(OrderTable.userId, userId))
        .orderBy(OrderTable.createdAt);

    return c.json(orders);
});

protectedApp.post("/", sValidator("json", createOrderSchema), async (c) => {
    const data = c.req.valid("json");

    const [user] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, data.userId));

    if (!user) {
        return c.json({ error: "User not found" }, 400);
    }

    const [order] = await db.insert(OrderTable).values(data).returning();

    return c.json(order, 201);
});

protectedApp.put("/:id", sValidator("json", updateOrderSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (data.userId) {
        const [user] = await db
            .select()
            .from(UserTable)
            .where(eq(UserTable.id, data.userId));

        if (!user) {
            return c.json({ error: "User not found" }, 400);
        }
    }

    const [order] = await db
        .update(OrderTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(OrderTable.id, id))
        .returning();

    if (!order) {
        return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(OrderTable).where(eq(OrderTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;
