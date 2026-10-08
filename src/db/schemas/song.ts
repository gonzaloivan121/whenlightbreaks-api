import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { AlbumTable } from "./album.ts";
import { ArtistTable } from "./artist.ts";

export const SongTable = pgTable("song", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    coverUrl: text().notNull(),
    songUrl: text().notNull(),
    albumId: uuid()
        .notNull()
        .references(() => AlbumTable.id, { onDelete: "cascade" }),
    artistId: uuid()
        .notNull()
        .references(() => ArtistTable.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
