import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ================================================================
   1. YOUR DATA MODELS & PRE-LOADED DATA
   ================================================================ */

class Member {
    constructor(id, name, email, type) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.type = type;
    }
}

class Book {
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

class DigitalBook extends Book {
    constructor(isbn, title, author, year, copies, genre, size, format, coverPath, filePath) {
        super(isbn, title, author, year, copies, genre, coverPath, filePath);
        this.size = size;
        this.format = format;
    }
}

const books = [];
const members = [];

export function initializeLibrary() {
    if (books.length > 0) return;

    books.push(
        new DigitalBook("9780134685991", "PARALLEL WORLDS", "Michio Kaku", 2012, 2, "fiction", "24 MB", "PDF", "covers/pworlds.png", "books/pworlds.pdf"),
        new DigitalBook("978013", "THE DON", "Ronald Perry", 2012, 2, "non-fiction", "84 MB", "PDF", "covers/don.png", "books/TheDon(Roland Perry).pdf"),
        new Book("9781491950296", "BEING LOGICAL", "D.Q McInery", 2020, 10, "non-fiction", "covers/logi.png", "books/being.pdf"),
        new Book("91950296", "UNTIL THE END OF TIME", "Brian Green", 2017, 6, "fiction", "covers/green.png", "books/green.epub"),
        new Book("919", "ASTROPHYSICS FOR PEOPLE IN A HURRY", "Neil deGrasse Tyson", 2010, 6, "fiction", "covers/astro.png", "books/astro.epub"),
        new Book("91009", "THE PSYCHOLOGY OF MONEY", "Morgan Housel", 2019, 3, "non-fiction", "covers/money.png", "books/money.epub"),
        new Book("889996", "THE ROAD TO REACT", "Robin Wieruch", 2018, 3, "non-fiction", "covers/react.png", "books/react.pdf")
    );

    members.push(
        new Member("M001", "John Smith", "john@gmail.com", "standard"),
        new Member("M002", "Jane Doe", "jane@gmail.com", "premium"),
        new Member("M003", "Mike Brown", "mike@gmail.com", "standard"),
        new Member("M004", "Sarah Jones", "sarah@gmail.com", "premium"),
    );
}

// Initialize your data
initializeLibrary();

/* ================================================================
   2. MAP YOUR DATA TO 3D SCENE REQUIREMENTS
   (Adds fallback descriptions and ratings since your classes don't have them)
   ================================================================ */
const sceneBooks = books.map(b => ({
    title: b.title,
    author: b.author,
    year: b.year,
    pages: b.copies + " Copies", // Re-purposed the 'pages' slot for copies
    rating: 4.2 + Math.random() * 0.6, // Random rating for visual stars
    genre: b.genre,
    desc: `Dive into "${b.title}" by ${b.author}. A compelling ${b.genre} read added to your personal collection.`,
    cover: b.cover,
    file: b.file,
    format: b.format
}));


/* ================================================================
   3. FALLBACK COVER GENERATOR
   ================================================================ */
function createFallbackCover(title, author) {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 450;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 300, 450);
    g.addColorStop(0, '#1a1520'); g.addColorStop(1, '#0c0a12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 450);
    
    ctx.strokeStyle = 'rgba(201,148,74,0.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 268, 418);
    ctx.strokeStyle = 'rgba(201,148,74,0.15)'; ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, 256, 406);
    
    ctx.fillStyle = '#ede4d3';
    ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    wrapText(ctx, title, 150, 200, 250, 32);
    
    ctx.fillStyle = '#c9944a';
    ctx.font = '16px "DM Sans", sans-serif';
    ctx.fillText(author, 150, 340);
    
    ctx.strokeStyle = 'rgba(201,148,74,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 300); ctx.lineTo(220, 300); ctx.stroke();
    return c;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' '); let line = ''; let currentY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), x, currentY); line = word + ' '; currentY += lineHeight;
        } else { line = test; }
    }
    ctx.fillText(line.trim(), x, currentY);
}


/* ================================================================
   4. THREE.JS SCENE SETUP
   ================================================================ */
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06060c, 0.018);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 1, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Environment Map
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
const ex = ec.getContext('2d');
const eg = ex.createLinearGradient(0, 0, 0, 512);
eg.addColorStop(0, '#1c1530'); eg.addColorStop(0.4, '#0e0c18'); eg.addColorStop(1, '#06060c');
ex.fillStyle = eg; ex.fillRect(0, 0, 1024, 512);
[[300,120,120,'rgba(201,148,74,0.18)'],[700,200,90,'rgba(201,148,74,0.12)'],
 [150,380,100,'rgba(100,130,180,0.10)'],[850,350,80,'rgba(180,140,100,0.08)']].forEach(([x,y,r,c]) => {
    ex.fillStyle = c; ex.beginPath(); ex.arc(x,y,Math.max(1,r),0,Math.PI*2); ex.fill();
});
const envTex = new THREE.CanvasTexture(ec); envTex.mapping = THREE.EquirectangularReflectionMapping;
const envScene = new THREE.Scene(); envScene.background = envTex;
const envEl1 = new THREE.PointLight(0xc9944a, 8, 30); envEl1.position.set(4,4,4); envScene.add(envEl1);
const envEl2 = new THREE.PointLight(0x6688aa, 5, 30); envEl2.position.set(-5,-2,3); envScene.add(envEl2);
scene.environment = pmrem.fromScene(envScene, 0.04).texture; pmrem.dispose();

// Lighting
scene.add(new THREE.AmbientLight(0x2a2030, 1.8));
const dirL = new THREE.DirectionalLight(0xffeedd, 1.8); dirL.position.set(6,8,5); scene.add(dirL);
const fillL = new THREE.DirectionalLight(0x8899bb, 0.5); fillL.position.set(-5,-3,-5); scene.add(fillL);
const ptL1 = new THREE.PointLight(0xc9944a, 3, 25); ptL1.position.set(5,3,4); scene.add(ptL1);
const ptL2 = new THREE.PointLight(0x5577aa, 2, 25); ptL2.position.set(-4,-2,4); scene.add(ptL2);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.04; controls.enablePan = false;
controls.minDistance = 7; controls.maxDistance = 22;
controls.autoRotate = true; controls.autoRotateSpeed = 0.25;
controls.maxPolarAngle = Math.PI * 0.72; controls.minPolarAngle = Math.PI * 0.28;

const texLoader = new THREE.TextureLoader();
function loadCoverTexture(coverPath, book) {
    return new Promise((resolve) => {
        texLoader.load(coverPath, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; resolve(tex); },
        undefined, () => {
            console.warn(`Cover not found: ${coverPath} — generating fallback.`);
            const fallbackTex = new THREE.CanvasTexture(createFallbackCover(book.title, book.author));
            fallbackTex.colorSpace = THREE.SRGBColorSpace; resolve(fallbackTex);
        });
    });
}

// Shared Geometries & Textures
const COVER_W = 1.1, COVER_H = 1.65;
const hitGeo = new THREE.PlaneGeometry(COVER_W + 0.4, COVER_H + 0.4);
const shardGeo = new THREE.OctahedronGeometry(0.04, 0);
const dotGeo = new THREE.SphereGeometry(0.018, 8, 8);

const spriteCanvas = document.createElement('canvas'); spriteCanvas.width = 64; spriteCanvas.height = 64;
const sctx = spriteCanvas.getContext('2d');
const sg = sctx.createRadialGradient(32,32,0,32,32,32);
sg.addColorStop(0, 'rgba(232,196,132,1.0)'); sg.addColorStop(0.3, 'rgba(201,148,74,0.5)'); sg.addColorStop(1, 'rgba(201,148,74,0.0)');
sctx.fillStyle = sg; sctx.fillRect(0,0,64,64);
const spriteTex = new THREE.CanvasTexture(spriteCanvas);

const backGlowCanvas = document.createElement('canvas'); backGlowCanvas.width = 256; backGlowCanvas.height = 384;
const bgCtx = backGlowCanvas.getContext('2d');
const bgGrad = bgCtx.createRadialGradient(128, 192, 20, 128, 192, 150);
bgGrad.addColorStop(0, 'rgba(201,148,74,0.35)'); bgGrad.addColorStop(0.5, 'rgba(201,148,74,0.08)'); bgGrad.addColorStop(1, 'rgba(201,148,74,0.0)');
bgCtx.fillStyle = bgGrad; bgCtx.fillRect(0,0,256,384);
const backGlowTex = new THREE.CanvasTexture(backGlowCanvas);


/* ================================================================
   5. BUILD 3D FLOATING BOOKS
   ================================================================ */
const sphereGroups = [];
const rayTargets = [];
const accentColors = [0xc9944a, 0xe8c484, 0xaa7733, 0xdbc08a, 0xb8862e, 0xf0d49a];


async function buildBooks() {
    // 1. Calculate positions dynamically based on EXACT current book count
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const basePositions = [];
    const total = sceneBooks.length;
    
    for (let i = 0; i < total; i++) {
        const y = 1 - (i / (total - 1 || 1)) * 2; // Added '|| 1' to prevent divide by zero if 0 books
        const rAtY = Math.sqrt(Math.max(0.001, 1 - y * y));
        const theta = goldenAngle * i;
        const spread = 5.0 + (Math.random() - 0.5) * 1.0;
        basePositions.push(new THREE.Vector3(
            Math.cos(theta) * rAtY * spread,
            y * spread * 0.65,
            Math.sin(theta) * rAtY * spread - 1.5
        ));
    }

    // 2. Build the 3D objects
    for (let i = 0; i < total; i++) {
        const book = sceneBooks[i]; 
        const group = new THREE.Group(); 
        const pos = basePositions[i]; // This will now NEVER be undefined
        group.position.copy(pos); group.scale.setScalar(0.001);
        
        const backGlowMat = new THREE.MeshBasicMaterial({ map: backGlowTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(COVER_W * 2.2, COVER_H * 2.2), backGlowMat); backGlow.position.z = -0.01; group.add(backGlow);
        
        const coverTex = await loadCoverTexture(book.cover, book);
        const coverMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.4, metalness: 0.0, side: THREE.DoubleSide });
        const coverMesh = new THREE.Mesh(new THREE.PlaneGeometry(COVER_W, COVER_H), coverMat); group.add(coverMesh);
        
        const hitbox = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false })); group.add(hitbox);
        
        const groupFloaters = []; const accent = accentColors[i % accentColors.length];
        for (let f = 0; f < 10; f++) {
            const isShard = f < 5;
            const mesh = new THREE.Mesh(isShard ? shardGeo : dotGeo, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: isShard ? 0.45 : 0.65 }));
            if (isShard) mesh.scale.set(0.8+Math.random()*2.5, 0.6+Math.random()*1.5, 0.6+Math.random()*1.5);
            group.add(mesh); groupFloaters.push({ mesh, rx:0.7+Math.random(), ry:0.6+Math.random()*0.9, rz:0.5+Math.random()*0.8, freqX:0.15+Math.random()*0.35, freqY:0.12+Math.random()*0.3, freqZ:0.1+Math.random()*0.25, phaseX:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, spinX:(Math.random()-0.5)*1.5, spinY:(Math.random()-0.5)*1.5, baseOpacity:isShard?0.45:0.65, pulseFreq:0.5+Math.random(), pulsePhase:Math.random()*Math.PI*2 });
        }
        for (let s = 0; s < 4; s++) {
            const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true, opacity: 0.12+Math.random()*0.15, blending: THREE.AdditiveBlending, depthWrite: false });
            const sprite = new THREE.Sprite(spriteMat); sprite.scale.set(0.2+Math.random()*0.35, 0.2+Math.random()*0.35, 1); group.add(sprite);
            groupFloaters.push({ sprite, rx:0.6+Math.random()*0.9, ry:0.5+Math.random()*0.8, rz:0.5+Math.random()*0.7, freqX:0.08+Math.random()*0.2, freqY:0.1+Math.random()*0.22, freqZ:0.07+Math.random()*0.18, phaseX:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, baseOpacity:spriteMat.opacity, pulseFreq:0.3+Math.random()*0.6, pulsePhase:Math.random()*Math.PI*2 });
        }
        
        group.userData = { idx:i, book, basePos:pos.clone(), phase:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, speed:0.25+Math.random()*0.25, amp:0.15+Math.random()*0.18, cover:coverMesh, hitbox, backGlow, floaters:groupFloaters, targetScale:1, currentScale:0.001, entryDelay:i*0.08, entered:false, baseBackGlowOpacity:0.6 };
        scene.add(group); sphereGroups.push(group); rayTargets.push(hitbox);
    }
    hideLoader();
}

// Background Particles
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(600 * 3);
for(let i=0; i<600; i++) { pPos[i*3]=(Math.random()-0.5)*50; pPos[i*3+1]=(Math.random()-0.5)*50; pPos[i*3+2]=(Math.random()-0.5)*50; }
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ map: spriteTex, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));

// Connection Lines
const linePositions = new Float32Array(200 * 6);
const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
const lineSegments = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xc9944a, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(lineSegments);

function updateLines() {
    let idx = 0;
    for (let i = 0; i < sphereGroups.length; i++) {
        for (let j = i + 1; j < sphereGroups.length; j++) {
            if (idx >= 200) break;
            if (sphereGroups[i].position.distanceTo(sphereGroups[j].position) < 4.0) {
                const pi = sphereGroups[i].position, pj = sphereGroups[j].position, b = idx * 6;
                linePositions[b]=pi.x; linePositions[b+1]=pi.y; linePositions[b+2]=pi.z;
                linePositions[b+3]=pj.x; linePositions[b+4]=pj.y; linePositions[b+5]=pj.z; idx++;
            }
        }
        if (idx >= 200) break;
    }
    for (let k = idx*6; k < linePositions.length; k++) linePositions[k] = 0;
    lineGeo.attributes.position.needsUpdate = true; lineGeo.setDrawRange(0, idx * 2);
}


/* ================================================================
   6. UI INTERACTIONS (PDF / EPUB HANDLING)
   ================================================================ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-100, -100);
let hoveredGroup = null;

const tooltip = document.getElementById('tooltip');
const tipTitle = document.getElementById('tipTitle');
const tipAuthor = document.getElementById('tipAuthor');
const bookDetail = document.getElementById('bookDetail');
const closeBtn = document.getElementById('closeBtn');
const actionBtn = document.getElementById('actionBtn');
const readBtn = document.getElementById('readBtn'); // This is now an <a> tag

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    tooltip.style.left = (e.clientX + 18) + 'px';
    tooltip.style.top = (e.clientY - 12) + 'px';
});

let touchStart = { x: 0, y: 0 };
window.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { touchStart.x = e.touches[0].clientX; touchStart.y = e.touches[0].clientY; } }, { passive: true });
window.addEventListener('touchend', (e) => {
    if (!e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const cx = (e.changedTouches[0].clientX / window.innerWidth) * 2 - 1, cy = -(e.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(cx, cy), camera);
        const hits = raycaster.intersectObjects(rayTargets);
        if (hits.length > 0 && !bookDetail.classList.contains('active')) openDetail(hits[0].object.parent.userData.book);
    }
}, { passive: true });

window.addEventListener('click', () => { if (hoveredGroup && !bookDetail.classList.contains('active')) openDetail(hoveredGroup.userData.book); });
closeBtn.addEventListener('click', () => bookDetail.classList.remove('active'));

const bookmarked = new Set();
actionBtn.addEventListener('click', () => {
    const title = document.getElementById('detailTitle').textContent;
    if (bookmarked.has(title)) {
        bookmarked.delete(title); actionBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save'; actionBtn.style.borderColor = ''; actionBtn.style.color = ''; actionBtn.style.background = '';
    } else {
        bookmarked.add(title); actionBtn.innerHTML = '<i class="fas fa-check"></i> Saved'; actionBtn.style.borderColor = '#4ade80'; actionBtn.style.color = '#4ade80'; actionBtn.style.background = 'rgba(74,222,128,0.08)';
        setTimeout(() => { actionBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save'; actionBtn.style.borderColor = ''; actionBtn.style.color = ''; actionBtn.style.background = ''; }, 2000);
    }
});

// Add these variables at the top with the other UI references
const readerOverlay = document.getElementById('readerOverlay');
const readerIframe = document.getElementById('readerIframe');
const readerTitle = document.getElementById('readerTitle');
const readerCloseBtn = document.getElementById('readerCloseBtn');

// Add this event listener right below the closeBtn listener
readerCloseBtn.addEventListener('click', () => {
    readerIframe.src = ''; // Stops the PDF from loading in the background
    readerOverlay.classList.remove('active');
});


// REPLACE the entire openDetail function with this one:
function openDetail(book) {
    document.getElementById('detailCover').src = book.cover;
    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = book.author;
    document.getElementById('detailDesc').textContent = book.desc;
    document.getElementById('detailYear').textContent = book.year;
    document.getElementById('detailFormat').textContent = book.format;
    document.getElementById('detailGenre').textContent = book.genre;

    const full = Math.floor(book.rating);
    const half = book.rating - full >= 0.3;
    let sh = ''; for (let s = 0; s < full; s++) sh += '<i class="fas fa-star"></i>'; if (half) sh += '<i class="fas fa-star-half-stroke"></i>';
    document.getElementById('detailStars').innerHTML = sh;
    document.getElementById('detailRatingNum').textContent = book.rating.toFixed(1);

    actionBtn.innerHTML = bookmarked.has(book.title) ? '<i class="fas fa-check"></i> Saved' : '<i class="fas fa-bookmark"></i> Save';
    actionBtn.style.borderColor = ''; actionBtn.style.color = ''; actionBtn.style.background = '';

    // Handle file opening
    if (book.file) {
        const isEpub = book.file.toLowerCase().endsWith('.epub');
        readBtn.classList.remove('no-pdf');
        
        if (isEpub) {
            // Browsers CANNOT read EPUBs natively. We force a download.
            readBtn.href = book.file;
            readBtn.removeAttribute('target');
            readBtn.setAttribute('download', '');
            readBtn.innerHTML = '<i class="fas fa-download"></i> Download EPUB';
            
            // Remove previous click listeners and set new one
            readBtn.onclick = (e) => {
                e.preventDefault(); // Stop normal anchor behavior
                const link = document.createElement('a');
                link.href = book.file;
                link.download = book.title.replace(/\s+/g, '_') + '.epub';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else {
            // PDFs open in our custom In-App Reader iframe
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
        readBtn.removeAttribute('href'); readBtn.removeAttribute('target'); readBtn.removeAttribute('download');
        readBtn.classList.add('no-pdf');
        readBtn.innerHTML = '<i class="fas fa-book-open"></i> No File';
        readBtn.onclick = null;
    }

    bookDetail.classList.add('active');
}


/* ================================================================
   7. ANIMATION LOOP
   ================================================================ */
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

let loaded = false;
function hideLoader() { if (loaded) return; loaded = true; document.getElementById('loader').classList.add('hidden'); }
setTimeout(hideLoader, 6000); // Fallback timeout

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    sphereGroups.forEach((group) => {
        const d = group.userData;
        if (!d.entered && t > d.entryDelay + 0.8) d.entered = true;
        const ease = d.entered ? (d.currentScale < 0.99 ? 0.06 : 0.1) : 0;
        d.currentScale += (d.targetScale - d.currentScale) * ease;

        if (d.entered) {
            group.position.set(d.basePos.x + Math.sin(t * d.speed + d.phase) * d.amp, d.basePos.y + Math.cos(t * d.speed * 0.7 + d.phaseY) * d.amp * 1.3, d.basePos.z + Math.sin(t * d.speed * 0.5 + d.phaseZ) * d.amp * 0.6);
        }
        group.scale.setScalar(Math.max(0.001, d.currentScale));
        d.cover.quaternion.copy(camera.quaternion);
        d.backGlow.quaternion.copy(camera.quaternion);
        if (d.entered) d.backGlow.material.opacity = d.baseBackGlowOpacity + Math.sin(t * 1.0 + d.phase) * 0.15;

        d.floaters.forEach((f) => {
            const opacity = f.baseOpacity * (0.6 + 0.4 * Math.sin(t * f.pulseFreq + f.pulsePhase));
            if (f.mesh) { f.mesh.position.set(Math.sin(t*f.freqX+f.phaseX)*f.rx, Math.cos(t*f.freqY+f.phaseY)*f.ry, Math.sin(t*f.freqZ+f.phaseZ)*f.rz); f.mesh.rotation.x = t*f.spinX; f.mesh.rotation.y = t*f.spinY; f.mesh.material.opacity = opacity; }
            if (f.sprite) { f.sprite.position.set(Math.sin(t*f.freqX+f.phaseX)*f.rx, Math.cos(t*f.freqY+f.phaseY)*f.ry, Math.sin(t*f.freqZ+f.phaseZ)*f.rz); f.sprite.material.opacity = opacity * 0.7; }
        });
    });

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(rayTargets);
    if (intersects.length > 0) {
        const hit = intersects[0].object.parent;
        if (hoveredGroup !== hit) {
            unhover(); hoveredGroup = hit; hoveredGroup.userData.targetScale = 1.22; hoveredGroup.userData.baseBackGlowOpacity = 1.0;
            hoveredGroup.userData.cover.material.emissive = new THREE.Color(0x1a1008);
            hoveredGroup.userData.floaters.forEach(f => { if(f.mesh) f.mesh.material.opacity = Math.min(1, f.baseOpacity*2); if(f.sprite) f.sprite.material.opacity = Math.min(1, f.baseOpacity*1.8); });
        }
        tipTitle.textContent = hit.userData.book.title; tipAuthor.textContent = hit.userData.book.author;
        tooltip.classList.add('visible'); renderer.domElement.style.cursor = 'pointer';
    } else { unhover(); tooltip.classList.remove('visible'); renderer.domElement.style.cursor = 'grab'; }

    updateLines();
    ptL1.position.x = Math.sin(t * 0.25) * 6; ptL1.position.y = Math.cos(t * 0.18) * 3 + 2;
    ptL2.position.x = Math.cos(t * 0.2) * 5; ptL2.position.z = Math.sin(t * 0.12) * 4 + 3;

    controls.update();
    renderer.render(scene, camera);
}

function unhover() {
    if (!hoveredGroup) return;
    hoveredGroup.userData.targetScale = 1; hoveredGroup.userData.baseBackGlowOpacity = 0.6;
    hoveredGroup.userData.cover.material.emissive = new THREE.Color(0x000000); hoveredGroup = null;
}

animate();

/* ================================================================
   8. INDEXED DB (BROWSER STORAGE FOR PERSISTENCE)
   ================================================================ */
class LibraryDB {
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

const db = new LibraryDB();


/* ================================================================
   9. DYNAMIC BOOK ADDITION UI
   ================================================================ */
const fabBtn = document.getElementById('fabBtn');
const addModal = document.getElementById('addModal');
const addCloseBtn = document.getElementById('addCloseBtn');
const addBookForm = document.getElementById('addBookForm');
const coverInput = document.getElementById('coverInput');
const bookInput = document.getElementById('bookInput');
const coverInputText = document.getElementById('coverInputText');
const bookInputText = document.getElementById('bookInputText');
const coverPreviewUpload = document.getElementById('coverPreviewUpload');

fabBtn.addEventListener('click', () => addModal.classList.add('active'));
addCloseBtn.addEventListener('click', () => resetAddForm());
addModal.addEventListener('click', (e) => { if (e.target === addModal) resetAddForm(); });

coverInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        coverInputText.textContent = file.name;
        coverPreviewUpload.src = URL.createObjectURL(file);
        coverPreviewUpload.style.display = 'block';
    } else { coverInputText.textContent = 'Choose Image...'; coverPreviewUpload.style.display = 'none'; }
});

bookInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    bookInputText.textContent = file ? file.name : 'Choose File...';
});

function resetAddForm() {
    addModal.classList.remove('active'); addBookForm.reset();
    coverPreviewUpload.style.display = 'none'; coverInputText.textContent = 'Choose Image...'; bookInputText.textContent = 'Choose File...';
}

addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('newTitle').value.trim();
    const author = document.getElementById('newAuthor').value.trim();
    const year = parseInt(document.getElementById('newYear').value) || 2023;
    const genre = document.getElementById('newGenre').value;
    const coverFile = coverInput.files[0];
    const bookFile = bookInput.files[0];
    const format = bookFile ? bookFile.name.split('.').pop().toUpperCase() : "NONE";

    // 1. Save file to browser storage
    await db.saveBook({ title, author, year, genre, format }, coverFile, bookFile);

    // 2. Create memory links for the 3D scene
    const newBook = {
        title: title || "Untitled Book", author: author || "Unknown Author", year,
        pages: "1 Copy", rating: 4.5, genre,
        desc: `Dynamically added: "${title}" by ${author}.`,
        cover: coverFile ? URL.createObjectURL(coverFile) : null,
        file: bookFile ? URL.createObjectURL(bookFile) : null,
        format: format
    };

    // 3. Add to scene
    sceneBooks.push(newBook);
    await addBookToScene(newBook);
    resetAddForm();
});


/* ================================================================
   10. DYNAMIC 3D SCENE INJECTION
   ================================================================ */
function getRandomSpherePoint(radius) {
    let x, y, z;
    do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; } while (x*x + y*y + z*z > 1);
    return new THREE.Vector3(x * radius, y * radius * 0.65, z * radius - 1.5);
}

async function addBookToScene(book) {
    const pos = getRandomSpherePoint(5.5);
    const i = sphereGroups.length;
    const group = new THREE.Group(); group.position.copy(pos); group.scale.setScalar(0.001);

    const backGlowMat = new THREE.MeshBasicMaterial({ map: backGlowTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(COVER_W * 2.2, COVER_H * 2.2), backGlowMat); backGlow.position.z = -0.01; group.add(backGlow);

    const coverTex = await loadCoverTexture(book.cover, book);
    const coverMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.1, metalness: 0.05, side: THREE.DoubleSide });
    const coverMesh = new THREE.Mesh(new THREE.PlaneGeometry(COVER_W, COVER_H), coverMat); group.add(coverMesh);

    const hitbox = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false })); group.add(hitbox);

    const groupFloaters = []; const accent = accentColors[i % accentColors.length];
    for (let f = 0; f < 10; f++) {
        const isShard = f < 5;
        const mesh = new THREE.Mesh(isShard ? shardGeo : dotGeo, new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: isShard ? 0.45 : 0.65 }));
        if (isShard) mesh.scale.set(0.8+Math.random()*2.5, 0.6+Math.random()*1.5, 0.6+Math.random()*1.5);
        group.add(mesh); groupFloaters.push({ mesh, rx:0.7+Math.random(), ry:0.6+Math.random()*0.9, rz:0.5+Math.random()*0.8, freqX:0.15+Math.random()*0.35, freqY:0.12+Math.random()*0.3, freqZ:0.1+Math.random()*0.25, phaseX:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, spinX:(Math.random()-0.5)*1.5, spinY:(Math.random()-0.5)*1.5, baseOpacity:isShard?0.45:0.65, pulseFreq:0.5+Math.random(), pulsePhase:Math.random()*Math.PI*2 });
    }
    for (let s = 0; s < 4; s++) {
        const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true, opacity: 0.12+Math.random()*0.15, blending: THREE.AdditiveBlending, depthWrite: false });
        const sprite = new THREE.Sprite(spriteMat); sprite.scale.set(0.2+Math.random()*0.35, 0.2+Math.random()*0.35, 1); group.add(sprite);
        groupFloaters.push({ sprite, rx:0.6+Math.random()*0.9, ry:0.5+Math.random()*0.8, rz:0.5+Math.random()*0.7, freqX:0.08+Math.random()*0.2, freqY:0.1+Math.random()*0.22, freqZ:0.07+Math.random()*0.18, phaseX:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, baseOpacity:spriteMat.opacity, pulseFreq:0.3+Math.random()*0.6, pulsePhase:Math.random()*Math.PI*2 });
    }

    group.userData = { idx:i, book, basePos:pos.clone(), phase:Math.random()*Math.PI*2, phaseY:Math.random()*Math.PI*2, phaseZ:Math.random()*Math.PI*2, speed:0.25+Math.random()*0.25, amp:0.15+Math.random()*0.18, cover:coverMesh, hitbox, backGlow, floaters:groupFloaters, targetScale:1, currentScale:0.001, entryDelay:0, entered:true, baseBackGlowOpacity:0.6 };
    scene.add(group); sphereGroups.push(group); rayTargets.push(hitbox);
}


/* ================================================================
   11. APP INITIALIZATION (Loads DB books before starting 3D)
   ================================================================ */
async function initApp() {
    // 1. Initialize IndexedDB
    await db.init();

    // 2. Fetch any books saved in the browser
    const savedBooks = await db.getAllBooks();

    // 3. Convert saved blobs into temporary URLs and push to scene array
    savedBooks.forEach(dbBook => {
        sceneBooks.push({
            title: dbBook.title, author: dbBook.author, year: dbBook.year, pages: "1 Copy",
            rating: 4.5, genre: dbBook.genre, format: dbBook.format,
            desc: `Saved book: "${dbBook.title}" by ${dbBook.author}.`,
            cover: dbBook.coverBlob ? URL.createObjectURL(dbBook.coverBlob) : null,
            file: dbBook.bookBlob ? URL.createObjectURL(dbBook.bookBlob) : null
        });
    });

    // 4. Build the 3D scene (hardcoded + dynamically saved books)
    await buildBooks();
}

// START THE APP - This must be the absolute last line in the file!
initApp();