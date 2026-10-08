import { numeric, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { UserTable } from "./user.ts";

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "completed",
    "cancelled",
]);

export const OrderTable = pgTable("order", {
    id: uuid().primaryKey().defaultRandom(),
    amount: numeric().notNull(),
    status: orderStatusEnum().notNull().default("pending"),
    userId: uuid()
        .notNull()
        .references(() => UserTable.id, { onDelete: "restrict" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
