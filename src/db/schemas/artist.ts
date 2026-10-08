import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const ArtistTable = pgTable("artist", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    artistUrl: text().notNull(),
    pictureUrl: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
