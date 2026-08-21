/* ================================================================
   APP ENTRY POINT
   Initialises data → database → 3D scene → starts render loop.
   This must be the module loaded by the <script> tag.
   ================================================================ */

import { initializeLibrary, mapBooksToScene, sceneBooks } from './models.js';
import { db } from './database.js';
import { buildBooks } from './bookBuilder.js';
import { animate } from './animationLoop.js';

async function initApp() {
    // 1. Populate in-memory book & member arrays
    initializeLibrary();

    // 2. Initialise IndexedDB
    await db.init();

    // 3. Restore any books previously saved to the browser
    const savedBooks = await db.getAllBooks();
    savedBooks.forEach(dbBook => {
        sceneBooks.push({
            title:  dbBook.title,
            author: dbBook.author,
            year:   dbBook.year,
            pages:  "1 Copy",
            rating: 4.5,
            genre:  dbBook.genre,
            format: dbBook.format,
            desc: `Saved book: "${dbBook.title}" by ${dbBook.author}.`,
            cover: dbBook.coverBlob ? URL.createObjectURL(dbBook.coverBlob) : null,
            file:  dbBook.bookBlob  ? URL.createObjectURL(dbBook.bookBlob)  : null
        });
    });

    // 4. Map raw Book objects → scene-ready objects (adds desc, rating, etc.)
    mapBooksToScene();

    // 5. Build all 3D floating books, then start the render loop
    await buildBooks();
    animate();
}

initApp();