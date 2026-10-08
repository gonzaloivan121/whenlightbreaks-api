import { numeric, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { UserTable } from "./user.ts";
import { OrderTable } from "./order.ts";

export const invoiceStatusEnum = pgEnum("invoice_status", [
    "pending",
    "paid",
    "cancelled",
]);

export const InvoiceTable = pgTable("invoice", {
    id: uuid().primaryKey().defaultRandom(),
    amount: numeric().notNull(),
    status: invoiceStatusEnum().notNull().default("pending"),
    userId: uuid()
        .notNull()
        .references(() => UserTable.id, { onDelete: "cascade" }),
    orderId: uuid()
        .notNull()
        .references(() => OrderTable.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
