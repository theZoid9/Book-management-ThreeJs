/* ================================================================
   INDEXED DB — BROWSER STORAGE FOR PERSISTENCE
   Stores uploaded books and the "already read" list.
   ================================================================ */

export class LibraryDB {
    constructor() {
        this.dbName = 'FloatingLibraryDB';
        this.storeName = 'books';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;
                console.log(`[DB] Upgrade ${oldVersion} → ${db.version}`);

                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    console.log('[DB] Created "books" store');
                }
                if (!db.objectStoreNames.contains('readBooks')) {
                    db.createObjectStore('readBooks', { keyPath: 'title' });
                    console.log('[DB] Created "readBooks" store');
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('[DB] Opened successfully, version', this.db.version);
                resolve();
            };

            request.onerror = (e) => {
                console.error('[DB] Failed to open:', e.target.error);
                reject(e.target.error);
            };

            request.onblocked = () => {
                console.warn('[DB] Blocked — close other tabs with this DB open');
            };
        });
    }

    /* ── Uploaded books ──────────────────────────────────────── */

    async saveBook(meta, coverFile, bookFile) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);

            const record = {
                title: meta.title,
                author: meta.author,
                year: meta.year,
                genre: meta.genre,
                format: meta.format,
                coverBlob: coverFile || null,
                bookBlob: bookFile || null
            };

            const req = store.add(record);
            req.onsuccess = () => {
                console.log('[DB] Saved book:', meta.title);
                resolve();
            };
            req.onerror = (e) => {
                console.error('[DB] Save failed:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    async getAllBooks() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const request = tx.objectStore(this.storeName).getAll();
            request.onsuccess = () => {
                console.log(`[DB] Loaded ${request.result.length} saved book(s) from store`);
                resolve(request.result);
            };
            request.onerror = (e) => {
                console.error('[DB] getAllBooks failed:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    async deleteBook(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const req = tx.objectStore(this.storeName).delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    /** Wipe every saved book (useful for debugging) */
    async clearAllBooks() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const req = tx.objectStore(this.storeName).clear();
            req.onsuccess = () => {
                console.log('[DB] Cleared all saved books');
                resolve();
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    /* ── Read-books list ────────────────────────────────────── */

    async markAsRead(bookInfo) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readwrite');
            const req = tx.objectStore('readBooks').put(bookInfo);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async removeRead(title) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readwrite');
            const req = tx.objectStore('readBooks').delete(title);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async getReadBooks() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readonly');
            const request = tx.objectStore('readBooks').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

/** Singleton instance */
export const db = new LibraryDB();