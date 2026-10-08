import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

export const ProductTable = pgTable("product", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text().notNull(),
    price: numeric().notNull(),
    imageUrl: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});