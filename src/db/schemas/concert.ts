import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ArtistTable } from "./artist.ts";

export const concertStatusEnum = pgEnum("concert_status", [
    "available",
    "sold-out",
    "coming-soon",
    "cancelled",
]);

export const ConcertTable = pgTable("concert", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    subtitle: text().notNull(),
    venue: text().notNull(),
    city: text().notNull(),
    state: text().notNull(),
    country: text().notNull(),
    directionsUrl: text().notNull(),
    date: timestamp({ withTimezone: true }).notNull(),
    status: concertStatusEnum().notNull().default("available"),
    ticketsUrl: text().notNull(),
    artistId: uuid()
        .notNull()
        .references(() => ArtistTable.id, { onDelete: "restrict" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});