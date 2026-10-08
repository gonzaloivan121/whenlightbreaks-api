import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { invoiceStatusEnum, InvoiceTable, OrderTable, UserTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const amountSchema = z
    .string()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/)
    .refine((price) => /[1-9]/.test(price), {
        error: "Amount must be greater than zero",
    });

const createInvoiceSchema = z.object({
    amount: amountSchema,
    status: z.enum(invoiceStatusEnum.enumValues),
    userId: z.uuid().min(1),
    orderId: z.uuid().min(1),
});

const updateInvoiceSchema = z.object({
    amount: amountSchema.optional(),
    status: z.enum(invoiceStatusEnum.enumValues).optional(),
    userId: z.uuid().min(1).optional(),
    orderId: z.uuid().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const invoices = await db
        .select()
        .from(InvoiceTable)
        .orderBy(InvoiceTable.createdAt);

    return c.json(invoices);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [invoice] = await db
        .select()
        .from(InvoiceTable)
        .where(eq(InvoiceTable.id, id));

    if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
    }

    return c.json(invoice);
});

app.get("/user/:userId", async (c) => {
    const userId = c.req.param("userId");
    const invoices = await db
        .select()
        .from(InvoiceTable)
        .where(eq(InvoiceTable.userId, userId))
        .orderBy(InvoiceTable.createdAt);

    return c.json(invoices);
});

app.get("/order/:orderId", async (c) => {
    const orderId = c.req.param("orderId");
    const invoices = await db
        .select()
        .from(InvoiceTable)
        .where(eq(InvoiceTable.orderId, orderId))
        .orderBy(InvoiceTable.createdAt);

    return c.json(invoices);
});

protectedApp.post("/", sValidator("json", createInvoiceSchema), async (c) => {
    const data = c.req.valid("json");

    const [user] = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, data.userId));

    if (!user) {
        return c.json({ error: "User not found" }, 400);
    }

    const [order] = await db
        .select()
        .from(OrderTable)
        .where(eq(OrderTable.id, data.orderId));

    if (!order) {
        return c.json({ error: "Order not found" }, 400);
    }

    const [invoice] = await db.insert(InvoiceTable).values(data).returning();

    return c.json(invoice, 201);
});

protectedApp.put("/:id", sValidator("json", updateInvoiceSchema), async (c) => {
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

    if (data.orderId) {
        const [order] = await db
            .select()
            .from(OrderTable)
            .where(eq(OrderTable.id, data.orderId));

        if (!order) {
            return c.json({ error: "Order not found" }, 400);
        }
    }

    const [invoice] = await db
        .update(InvoiceTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(InvoiceTable.id, id))
        .returning();

    if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
    }

    return c.json(invoice);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(InvoiceTable).where(eq(InvoiceTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;