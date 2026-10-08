import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const SocialLinkTable = pgTable("social_link", {
    id: uuid().primaryKey().defaultRandom(),
    label: text().notNull(),
    icon: text().notNull(),
    url: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
