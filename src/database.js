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
            // Version bumped to 2 — triggers onupgradeneeded for the new store
            const request = indexedDB.open(this.dbName, 2);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('readBooks')) {
                    db.createObjectStore('readBooks', { keyPath: 'title' });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            request.onerror = (e) => reject(e);
        });
    }

    /* ── Uploaded books ──────────────────────────────────────── */

    async saveBook(meta, coverFile, bookFile) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.add({ ...meta, coverBlob: coverFile || null, bookBlob: bookFile || null });
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    async getAllBooks() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e);
        });
    }

    /* ── Read-books list ────────────────────────────────────── */

    async markAsRead(bookInfo) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readwrite');
            tx.objectStore('readBooks').put(bookInfo);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    async removeRead(title) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readwrite');
            tx.objectStore('readBooks').delete(title);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    async getReadBooks() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('readBooks', 'readonly');
            const request = tx.objectStore('readBooks').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e);
        });
    }
}

/** Singleton instance */
export const db = new LibraryDB();