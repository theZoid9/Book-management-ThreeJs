/* ================================================================
   DATA MODELS & PRE-LOADED LIBRARY DATA
   ================================================================ */

export class Member {
    constructor(id, name, email, type) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.type = type;
    }
}

export class Book {
    constructor(isbn, title, author, year, copies, genre, coverPath, filePath) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.year = year;
        this.copies = copies;
        this.genre = genre;
        this.cover = coverPath;
        this.file = filePath;
        this.format = filePath ? filePath.split('.').pop().toUpperCase() : "UNKNOWN";
    }
}

export class DigitalBook extends Book {
    constructor(isbn, title, author, year, copies, genre, size, format, coverPath, filePath) {
        super(isbn, title, author, year, copies, genre, coverPath, filePath);
        this.size = size;
        this.format = format;
    }
}

export const books = [];
export const members = [];

/** Populates the books[] and members[] arrays with hardcoded data */
export function initializeLibrary() {
    if (books.length > 0) return;

    books.push(
        new DigitalBook("9780134685991", "PARALLEL WORLDS", "Michio Kaku", 2012, 2, "fiction", "24 MB", "PDF", "public/covers/pworlds.png", "public/books/pworlds.pdf"),
        new DigitalBook("978013", "THE DON", "Ronald Perry", 2012, 2, "non-fiction", "84 MB", "PDF", "public/covers/don.png", "public/books/TheDon(Roland Perry).pdf"),
        new Book("9781491950296", "BEING LOGICAL", "D.Q McInery", 2020, 10, "non-fiction", "public/covers/logi.png", "public/books/being.pdf"),
        new Book("91950296", "UNTIL THE END OF TIME", "Brian Green", 2017, 6, "fiction", "public/covers/green.png", "public/books/green.epub"),
        new Book("919", "ASTROPHYSICS FOR PEOPLE IN A HURRY", "Neil deGrasse Tyson", 2010, 6, "fiction", "public/covers/astro.png", "public/books/astro.epub"),
        new Book("91009", "THE PSYCHOLOGY OF MONEY", "Morgan Housel", 2019, 3, "non-fiction", "public/covers/money.png", "public/books/money.epub"),
        new Book("889996", "THE ROAD TO REACT", "Robin Wieruch", 2018, 3, "non-fiction", "public/covers/react.png", "public/books/react.pdf")
    );

    members.push(
        new Member("M001", "John Smith", "john@gmail.com", "standard"),
        new Member("M002", "Jane Doe", "jane@gmail.com", "premium"),
        new Member("M003", "Mike Brown", "mike@gmail.com", "standard"),
        new Member("M004", "Sarah Jones", "sarah@gmail.com", "premium"),
    );
}

/**
 * Scene-ready book objects consumed by the 3D builder.
 * Adds fallback description and rating since the raw classes don't carry them.
 */
export const sceneBooks = [];

export function mapBooksToScene() {
    if (sceneBooks.length > 0) return;

    books.forEach(b => {
        sceneBooks.push({
            title: b.title,
            author: b.author,
            year: b.year,
            pages: b.copies + " Copies",
            rating: 4.2 + Math.random() * 0.6,
            genre: b.genre,
            desc: `Dive into "${b.title}" by ${b.author}. A compelling ${b.genre} read added to your personal collection.`,
            cover: b.cover,
            file: b.file,
            format: b.format
        });
    });
}