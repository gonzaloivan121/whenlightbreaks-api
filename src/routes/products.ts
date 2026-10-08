import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import z from "zod";
import { db } from "../db/db.ts";
import { ProductTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { apiKeyAuth, type ApiKeyEnv } from "../middleware/auth.ts";

const priceSchema = z
    .string()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/)
    .refine((price) => /[1-9]/.test(price), {
        error: "Price must be greater than zero",
    });

const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: priceSchema,
    imageUrl: z.string().min(1),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: priceSchema.optional(),
    imageUrl: z.string().min(1).optional(),
});

const app = new Hono();
const protectedApp = new Hono<ApiKeyEnv>();
protectedApp.use(apiKeyAuth);

app.get("/", async (c) => {
    const products = await db
        .select()
        .from(ProductTable)
        .orderBy(ProductTable.createdAt);

    return c.json(products);
});

app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const [product] = await db
        .select()
        .from(ProductTable)
        .where(eq(ProductTable.id, id));

    if (!product) {
        return c.json({ error: "Product not found" }, 404);
    }

    return c.json(product);
});

protectedApp.post("/", sValidator("json", createProductSchema), async (c) => {
    const data = c.req.valid("json");

    const [product] = await db
        .insert(ProductTable)
        .values(data)
        .returning();

    return c.json(product, 201);
});

protectedApp.put("/:id", sValidator("json", updateProductSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const [product] = await db
        .update(ProductTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ProductTable.id, id))
        .returning();

    if (!product) {
        return c.json({ error: "Product not found" }, 404);
    }

    return c.json(product);
});

protectedApp.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(ProductTable).where(eq(ProductTable.id, id));

    return c.body(null, 204);
});

app.route("/", protectedApp);

export default app;