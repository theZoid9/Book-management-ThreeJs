/* ================================================================
   APP ENTRY POINT
   Initialises data → database → read-list → 3D scene → render loop.
   ================================================================ */

import { initializeLibrary, mapBooksToScene, sceneBooks, books} from './models.js';
import { db } from './database.js';
import { buildBooks } from './bookBuilder.js';
import { animate } from './animationLoop.js';
import { state } from './state.js';
import { updateReadBadge } from './interactions.js';

async function initApp() {

    /* ── 1. Hardcoded / preloaded books ─────────────────────── */
    initializeLibrary();
    console.log(`[APP] ${books.length} preloaded book(s) in memory`);

    /* ── 2. Open IndexedDB ──────────────────────────────────── */
    try {
        await db.init();
    } catch (err) {
        console.error('[APP] DB init failed, continuing without persistence:', err);
    }

    /* ── 3. Restore read-book titles ────────────────────────── */
    try {
        const readList = await db.getReadBooks();
        readList.forEach(entry => state.readBooks.add(entry.title));
        console.log(`[APP] Restored ${readList.length} read-book title(s)`);
    } catch (err) {
        console.warn('[APP] Could not load read list:', err);
    }
    updateReadBadge();

    /* ── 4. Restore user-added books from IndexedDB ─────────── */
    try {
        const savedBooks = await db.getAllBooks();

        savedBooks.forEach(dbBook => {
            let coverURL = null;
            let fileURL = null;

            if (dbBook.coverBlob) {
                try {
                    coverURL = URL.createObjectURL(dbBook.coverBlob);
                } catch (e) {
                    console.warn(`[APP] Bad cover blob for "${dbBook.title}":`, e);
                }
            }
            if (dbBook.bookBlob) {
                try {
                    fileURL = URL.createObjectURL(dbBook.bookBlob);
                } catch (e) {
                    console.warn(`[APP] Bad file blob for "${dbBook.title}":`, e);
                }
            }

            sceneBooks.push({
                title:  dbBook.title  || 'Untitled',
                author: dbBook.author || 'Unknown',
                year:   dbBook.year   || 2024,
                pages:  '1 Copy',
                rating: 4.5,
                genre:  dbBook.genre  || '—',
                format: dbBook.format || 'NONE',
                desc: `Previously added: "${dbBook.title}" by ${dbBook.author}.`,
                cover: coverURL,
                file:  fileURL
            });
        });

        console.log(`[APP] Restored ${savedBooks.length} book(s) from DB → sceneBooks now has ${sceneBooks.length} total`);
    } catch (err) {
        console.warn('[APP] Could not load saved books from DB:', err);
    }

    /* ── 5. Map hardcoded books into sceneBooks ─────────────── */
    mapBooksToScene();
    console.log(`[APP] After mapping preloaded books → sceneBooks has ${sceneBooks.length} total`);

    /* ── 6. Build 3D scene & start render loop ──────────────── */
    await buildBooks();
    animate();
}

initApp();