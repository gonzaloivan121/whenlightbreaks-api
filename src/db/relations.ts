import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.ts";

export const relations = defineRelations(schema, (r) => ({
    AlbumTable: {
        artist: r.one.ArtistTable({
            from: r.AlbumTable.artistId,
            to: r.ArtistTable.id,
        }),
        songs: r.many.SongTable(),
    },
    ApiKeyTable: {
        user: r.one.UserTable({
            from: r.ApiKeyTable.userId,
            to: r.UserTable.id,
        }),
    },
    ArtistTable: {
        albums: r.many.AlbumTable(),
        concerts: r.many.ConcertTable(),
        songs: r.many.SongTable(),
    },
    ConcertTable: {
        artist: r.one.ArtistTable({
            from: r.ConcertTable.artistId,
            to: r.ArtistTable.id,
        }),
    },
    InvoiceTable: {
        order: r.one.OrderTable({
            from: r.InvoiceTable.orderId,
            to: r.OrderTable.id,
        }),
        user: r.one.UserTable({
            from: r.InvoiceTable.userId,
            to: r.UserTable.id,
        }),
    },
    OrderTable: {
        invoices: r.many.InvoiceTable(),
        user: r.one.UserTable({
            from: r.OrderTable.userId,
            to: r.UserTable.id,
        }),
    },
    SongTable: {
        album: r.one.AlbumTable({
            from: r.SongTable.albumId,
            to: r.AlbumTable.id,
        }),
        artist: r.one.ArtistTable({
            from: r.SongTable.artistId,
            to: r.ArtistTable.id,
        }),
    },
    UserTable: {
        apiKeys: r.many.ApiKeyTable(),
        invoices: r.many.InvoiceTable(),
        orders: r.many.OrderTable(),
    },
}));
