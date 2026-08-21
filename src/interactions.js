/* ================================================================
   UI INTERACTIONS
   Raycasting · tooltip · detail panel · in-app PDF reader ·
   "Mark as Read" toggle · "Add Book" modal · focus-on-click
   ================================================================ */

import * as THREE from 'three';
import { camera, renderer, controls } from './sceneSetup.js';
import { state } from './state.js';
import { sceneBooks } from './models.js';
import { addBookToScene } from './bookBuilder.js';
import { db } from './database.js';

// ── DOM references ─────────────────────────────────────────────
const tooltip        = document.getElementById('tooltip');
const tipTitle       = document.getElementById('tipTitle');
const tipAuthor      = document.getElementById('tipAuthor');
const bookDetail     = document.getElementById('bookDetail');
const closeBtn       = document.getElementById('closeBtn');
const actionBtn      = document.getElementById('actionBtn');
const readBtn        = document.getElementById('readBtn');
const readerOverlay  = document.getElementById('readerOverlay');
const readerIframe   = document.getElementById('readerIframe');
const readerTitle    = document.getElementById('readerTitle');
const readerCloseBtn = document.getElementById('readerCloseBtn');

const fabBtn             = document.getElementById('fabBtn');
const addModal           = document.getElementById('addModal');
const addCloseBtn        = document.getElementById('addCloseBtn');
const addBookForm        = document.getElementById('addBookForm');
const coverInput         = document.getElementById('coverInput');
const bookInput          = document.getElementById('bookInput');
const coverInputText     = document.getElementById('coverInputText');
const bookInputText      = document.getElementById('bookInputText');
const coverPreviewUpload = document.getElementById('coverPreviewUpload');

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
            focusOnGroup(hits[0].object.parent);
            openDetail(hits[0].object.parent.userData.book);
        }
    }
}, { passive: true });

// ── Click → focus + open detail ────────────────────────────────
window.addEventListener('click', () => {
    if (state.hoveredGroup && !bookDetail.classList.contains('active')) {
        focusOnGroup(state.hoveredGroup);
        openDetail(state.hoveredGroup.userData.book);
    }
});

// ── Close detail → unfocus ─────────────────────────────────────
closeBtn.addEventListener('click', () => {
    bookDetail.classList.remove('active');
    startUnfocus();
});

// ── Close reader overlay (detail stays open) ───────────────────
readerCloseBtn.addEventListener('click', () => {
    readerIframe.src = '';
    readerOverlay.classList.remove('active');
});

// ── "Mark as Read" toggle ──────────────────────────────────────
actionBtn.addEventListener('click', () => {
    const title = document.getElementById('detailTitle').textContent;
    // Find the full book object from sceneBooks
    const book = sceneBooks.find(b => b.title === title);
    if (!book) return;
    toggleReadStatus(book);
});

async function toggleReadStatus(book) {
    if (state.readBooks.has(book.title)) {
        // Un-mark
        state.readBooks.delete(book.title);
        await db.removeRead(book.title);
        setActionButton(false);
    } else {
        // Mark as read
        state.readBooks.add(book.title);
        await db.markAsRead({
            title: book.title, author: book.author,
            year: book.year, genre: book.genre, format: book.format
        });
        setActionButton(true);
    }
}

function setActionButton(isRead) {
    if (isRead) {
        actionBtn.innerHTML = '<i class="fas fa-check-circle"></i> Read';
        actionBtn.style.borderColor = '#4ade80';
        actionBtn.style.color = '#4ade80';
        actionBtn.style.background = 'rgba(74,222,128,0.08)';
    } else {
        actionBtn.innerHTML = '<i class="fas fa-book"></i> Mark as Read';
        actionBtn.style.borderColor = '';
        actionBtn.style.color = '';
        actionBtn.style.background = '';
    }
}

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

    // Read-status button
    setActionButton(state.readBooks.has(book.title));

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
                autoMarkRead(book);
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
                autoMarkRead(book);
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

/** Silently marks a book as read when the user opens/downloads it */
async function autoMarkRead(book) {
    if (state.readBooks.has(book.title)) return;
    state.readBooks.add(book.title);
    await db.markAsRead({
        title: book.title, author: book.author,
        year: book.year, genre: book.genre, format: book.format
    });
    setActionButton(true);
}

// ── Focus / unfocus helpers ────────────────────────────────────

function focusOnGroup(group) {
    const bookPos = group.userData.basePos.clone();

    // Place camera 3.5 units in front of the book, toward the current camera
    const dirToCamera = camera.position.clone().sub(bookPos).normalize();
    const focusCamPos = bookPos.clone().add(dirToCamera.multiplyScalar(3.5));

    state.focusGroup     = group;
    state.focusCamPos    = focusCamPos;
    state.focusBookPos   = bookPos;
    state.originalCamPos = camera.position.clone();
    state.originalTarget = controls.target.clone();
    state.focusLerp      = 0;
    state.isFocusing     = true;
    state.isUnfocusing   = false;

    // Disable orbit while focused
    controls.enabled    = false;
    controls.autoRotate = false;
}

function startUnfocus() {
    if (state.focusLerp > 0.01) {
        state.isFocusing   = false;
        state.isUnfocusing = true;
    }
}

// ── Hover state (called each frame from animationLoop) ─────────
export function updateHoverState(intersects) {
    if (intersects.length > 0) {
        const hit = intersects[0].object.parent;

        if (state.hoveredGroup !== hit) {
            if (state.hoveredGroup) {
                state.hoveredGroup.userData.targetScale = 1;
                state.hoveredGroup.userData.baseBackGlowOpacity = 0.6;
                state.hoveredGroup.userData.cover.material.emissive =
                    new THREE.Color(0x000000);
            }
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

    await db.saveBook({ title, author, year, genre, format }, coverFile, bookFile);

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