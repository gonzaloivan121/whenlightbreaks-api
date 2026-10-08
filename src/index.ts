import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import albumRoutes from "./routes/albums.ts";
import apiKeyRoutes from "./routes/apiKeys.ts";
import artistsRoutes from "./routes/artists.ts";
import authRoutes from "./routes/auth.ts";
import concertRoutes from "./routes/concerts.ts";
import invoiceRoutes from "./routes/invoices.ts";
import navigationLinkRoutes from "./routes/navigationLinks.ts";
import orderRoutes from "./routes/orders.ts";
import productRoutes from "./routes/products.ts";
import socialLinkRoutes from "./routes/socialLinks.ts";
import songRoutes from "./routes/songs.ts";
import streamingLinkRoutes from "./routes/streamingLinks.ts";
import userRoutes from "./routes/users.ts";

import { env } from "./data/env.ts";

const app = new Hono();

app.use('/*', cors({
    origin: 'http://localhost:4200',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
}));

app.route("/albums", albumRoutes);
app.route("/api-keys", apiKeyRoutes);
app.route("/artists", artistsRoutes);
app.route("/auth", authRoutes);
app.route("/concerts", concertRoutes);
app.route("/invoices", invoiceRoutes);
app.route("/navigation-links", navigationLinkRoutes);
app.route("/orders", orderRoutes);
app.route("/products", productRoutes);
app.route("/social-links", socialLinkRoutes);
app.route("/songs", songRoutes);
app.route("/streaming-links", streamingLinkRoutes);
app.route("/users", userRoutes);

serve({
    fetch: app.fetch,
    port: env.PORT,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
