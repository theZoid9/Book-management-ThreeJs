/* ================================================================
   INDEXED DB — BROWSER STORAGE FOR PERSISTENCE
   ================================================================ */

export class LibraryDB {
    constructor() {
        this.dbName = 'FloatingLibraryDB';
        this.storeName = 'books';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            request.onerror = (e) => reject(e);
        });
    }

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
}

/** Singleton instance — imported wherever DB access is needed */
export const db = new LibraryDB();