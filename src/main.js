import { initializeLibrary, mapBooksToScene, sceneBooks } from './models.js';
import { db } from './database.js';
import { buildBooks } from './bookBuilder.js';
import { animate } from './animationLoop.js';
import { state } from './state.js';
import { updateReadBadge } from './interactions.js';   // ← add this

async function initApp() {
    initializeLibrary();
    await db.init();

    // Restore read-book titles
    const readList = await db.getReadBooks();
    readList.forEach(entry => state.readBooks.add(entry.title));
    updateReadBadge();                                   // ← add this

    // Restore uploaded books
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

    mapBooksToScene();
    await buildBooks();
    animate();
}

initApp();