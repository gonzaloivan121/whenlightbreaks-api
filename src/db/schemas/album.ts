import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ArtistTable } from "./artist.ts";

export const AlbumTable = pgTable("album", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    coverUrl: text().notNull(),
    albumUrl: text().notNull(),
    artistId: uuid()
        .notNull()
        .references(() => ArtistTable.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
