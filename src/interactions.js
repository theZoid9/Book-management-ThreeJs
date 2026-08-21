/* ================================================================
   UI INTERACTIONS
   Raycasting, tooltip, detail panel, in-app PDF reader,
   bookmark toggle, and the "Add Book" modal / form.
   ================================================================ */

import * as THREE from 'three';
import { camera, renderer } from './sceneSetup.js';
import { state } from './state.js';
import { sceneBooks } from './models.js';
import { addBookToScene } from './bookBuilder.js';
import { db } from './database.js';

// ── DOM references ─────────────────────────────────────────────
const tooltip       = document.getElementById('tooltip');
const tipTitle      = document.getElementById('tipTitle');
const tipAuthor     = document.getElementById('tipAuthor');
const bookDetail    = document.getElementById('bookDetail');
const closeBtn      = document.getElementById('closeBtn');
const actionBtn     = document.getElementById('actionBtn');
const readBtn       = document.getElementById('readBtn');
const readerOverlay = document.getElementById('readerOverlay');
const readerIframe  = document.getElementById('readerIframe');
const readerTitle   = document.getElementById('readerTitle');
const readerCloseBtn = document.getElementById('readerCloseBtn');

const fabBtn              = document.getElementById('fabBtn');
const addModal            = document.getElementById('addModal');
const addCloseBtn         = document.getElementById('addCloseBtn');
const addBookForm         = document.getElementById('addBookForm');
const coverInput          = document.getElementById('coverInput');
const bookInput           = document.getElementById('bookInput');
const coverInputText      = document.getElementById('coverInputText');
const bookInputText       = document.getElementById('bookInputText');
const coverPreviewUpload  = document.getElementById('coverPreviewUpload');

const bookmarked = new Set();

// ── Mouse tracking ─────────────────────────────────────────────
window.addEventListener('mousemove', (e) => {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    tooltip.style.left = (e.clientX + 18) + 'px';
    tooltip.style.top  = (e.clientY - 12) + 'px';
});

// ── Touch support (tap = click) ────────────────────────────────
let touchStart = { x: 0, y: 0 };
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const cx = (e.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
        const cy = -(e.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
        state.raycaster.setFromCamera(new THREE.Vector2(cx, cy), camera);
        const hits = state.raycaster.intersectObjects(state.rayTargets);
        if (hits.length > 0 && !bookDetail.classList.contains('active')) {
            openDetail(hits[0].object.parent.userData.book);
        }
    }
}, { passive: true });

// ── Click to open detail ───────────────────────────────────────
window.addEventListener('click', () => {
    if (state.hoveredGroup && !bookDetail.classList.contains('active')) {
        openDetail(state.hoveredGroup.userData.book);
    }
});

// ── Close panels ───────────────────────────────────────────────
closeBtn.addEventListener('click', () => bookDetail.classList.remove('active'));

readerCloseBtn.addEventListener('click', () => {
    readerIframe.src = '';
    readerOverlay.classList.remove('active');
});

// ── Bookmark toggle ────────────────────────────────────────────
actionBtn.addEventListener('click', () => {
    const title = document.getElementById('detailTitle').textContent;
    if (bookmarked.has(title)) {
        bookmarked.delete(title);
        actionBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
        actionBtn.style.borderColor = '';
        actionBtn.style.color = '';
        actionBtn.style.background = '';
    } else {
        bookmarked.add(title);
        actionBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
        actionBtn.style.borderColor = '#4ade80';
        actionBtn.style.color = '#4ade80';
        actionBtn.style.background = 'rgba(74,222,128,0.08)';
        setTimeout(() => {
            actionBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            actionBtn.style.borderColor = '';
            actionBtn.style.color = '';
            actionBtn.style.background = '';
        }, 2000);
    }
});

// ── Open detail panel ──────────────────────────────────────────
function openDetail(book) {
    document.getElementById('detailCover').src    = book.cover;
    document.getElementById('detailTitle').textContent  = book.title;
    document.getElementById('detailAuthor').textContent = book.author;
    document.getElementById('detailDesc').textContent   = book.desc;
    document.getElementById('detailYear').textContent   = book.year;
    document.getElementById('detailFormat').textContent = book.format;
    document.getElementById('detailGenre').textContent  = book.genre;

    // Star rating
    const full = Math.floor(book.rating);
    const half = book.rating - full >= 0.3;
    let sh = '';
    for (let s = 0; s < full; s++) sh += '<i class="fas fa-star"></i>';
    if (half) sh += '<i class="fas fa-star-half-stroke"></i>';
    document.getElementById('detailStars').innerHTML = sh;
    document.getElementById('detailRatingNum').textContent = book.rating.toFixed(1);

    // Bookmark state
    actionBtn.innerHTML = bookmarked.has(book.title)
        ? '<i class="fas fa-check"></i> Saved'
        : '<i class="fas fa-bookmark"></i> Save';
    actionBtn.style.borderColor = '';
    actionBtn.style.color = '';
    actionBtn.style.background = '';

    // File handling: PDF → in-app reader, EPUB → download, none → disabled
    if (book.file) {
        const isEpub = book.file.toLowerCase().endsWith('.epub');
        readBtn.classList.remove('no-pdf');

        if (isEpub) {
            readBtn.href = book.file;
            readBtn.removeAttribute('target');
            readBtn.setAttribute('download', '');
            readBtn.innerHTML = '<i class="fas fa-download"></i> Download EPUB';
            readBtn.onclick = (e) => {
                e.preventDefault();
                const link = document.createElement('a');
                link.href = book.file;
                link.download = book.title.replace(/\s+/g, '_') + '.epub';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else {
            readBtn.removeAttribute('download');
            readBtn.removeAttribute('href');
            readBtn.innerHTML = '<i class="fas fa-book-open"></i> Read PDF';
            readBtn.onclick = (e) => {
                e.preventDefault();
                readerTitle.textContent = book.title;
                readerIframe.src = book.file;
                readerOverlay.classList.add('active');
            };
        }
    } else {
        readBtn.removeAttribute('href');
        readBtn.removeAttribute('target');
        readBtn.removeAttribute('download');
        readBtn.classList.add('no-pdf');
        readBtn.innerHTML = '<i class="fas fa-book-open"></i> No File';
        readBtn.onclick = null;
    }

    bookDetail.classList.add('active');
}

// ── Hover state update (called each frame from animationLoop) ──
export function updateHoverState(intersects) {
    if (intersects.length > 0) {
        const hit = intersects[0].object.parent;

        if (state.hoveredGroup !== hit) {
            // Un-hover previous
            if (state.hoveredGroup) {
                state.hoveredGroup.userData.targetScale = 1;
                state.hoveredGroup.userData.baseBackGlowOpacity = 0.6;
                state.hoveredGroup.userData.cover.material.emissive =
                    new THREE.Color(0x000000);
            }
            // Hover new
            state.hoveredGroup = hit;
            state.hoveredGroup.userData.targetScale = 1.22;
            state.hoveredGroup.userData.baseBackGlowOpacity = 1.0;
            state.hoveredGroup.userData.cover.material.emissive =
                new THREE.Color(0x1a1008);
            state.hoveredGroup.userData.floaters.forEach(f => {
                if (f.mesh)   f.mesh.material.opacity   = Math.min(1, f.baseOpacity * 2);
                if (f.sprite) f.sprite.material.opacity = Math.min(1, f.baseOpacity * 1.8);
            });
        }

        tipTitle.textContent  = hit.userData.book.title;
        tipAuthor.textContent = hit.userData.book.author;
        tooltip.classList.add('visible');
        renderer.domElement.style.cursor = 'pointer';
    } else {
        if (state.hoveredGroup) {
            state.hoveredGroup.userData.targetScale = 1;
            state.hoveredGroup.userData.baseBackGlowOpacity = 0.6;
            state.hoveredGroup.userData.cover.material.emissive =
                new THREE.Color(0x000000);
            state.hoveredGroup = null;
        }
        tooltip.classList.remove('visible');
        renderer.domElement.style.cursor = 'grab';
    }
}

// ── Add Book Modal ─────────────────────────────────────────────
fabBtn.addEventListener('click', () => addModal.classList.add('active'));
addCloseBtn.addEventListener('click', () => resetAddForm());
addModal.addEventListener('click', (e) => {
    if (e.target === addModal) resetAddForm();
});

coverInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        coverInputText.textContent = file.name;
        coverPreviewUpload.src = URL.createObjectURL(file);
        coverPreviewUpload.style.display = 'block';
    } else {
        coverInputText.textContent = 'Choose Image...';
        coverPreviewUpload.style.display = 'none';
    }
});

bookInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    bookInputText.textContent = file ? file.name : 'Choose File...';
});

function resetAddForm() {
    addModal.classList.remove('active');
    addBookForm.reset();
    coverPreviewUpload.style.display = 'none';
    coverInputText.textContent = 'Choose Image...';
    bookInputText.textContent  = 'Choose File...';
}

addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title  = document.getElementById('newTitle').value.trim();
    const author = document.getElementById('newAuthor').value.trim();
    const year   = parseInt(document.getElementById('newYear').value) || 2023;
    const genre  = document.getElementById('newGenre').value;
    const coverFile = coverInput.files[0];
    const bookFile  = bookInput.files[0];
    const format = bookFile ? bookFile.name.split('.').pop().toUpperCase() : "NONE";

    // Persist to IndexedDB
    await db.saveBook({ title, author, year, genre, format }, coverFile, bookFile);

    // Create scene-ready object
    const newBook = {
        title:  title  || "Untitled Book",
        author: author || "Unknown Author",
        year,
        pages:  "1 Copy",
        rating: 4.5,
        genre,
        desc: `Dynamically added: "${title}" by ${author}.`,
        cover:  coverFile ? URL.createObjectURL(coverFile) : null,
        file:   bookFile  ? URL.createObjectURL(bookFile)  : null,
        format
    };

    sceneBooks.push(newBook);
    await addBookToScene(newBook);
    resetAddForm();
});