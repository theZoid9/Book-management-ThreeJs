/* ================================================================
   THREE.JS SCENE, CAMERA, RENDERER, LIGHTING, CONTROLS,
   SHARED GEOMETRIES / TEXTURES, PARTICLES & CONNECTION LINES
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFallbackCover } from './coverGenerator.js';

// ── Scene ──────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06060c, 0.018);

// ── Camera ─────────────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(
    48, window.innerWidth / window.innerHeight, 0.1, 120
);
camera.position.set(0, 1, 14);

// ── Renderer ───────────────────────────────────────────────────
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ── Environment Map (procedural) ───────────────────────────────
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

const ec = document.createElement('canvas');
ec.width = 1024;
ec.height = 512;
const ex = ec.getContext('2d');
const eg = ex.createLinearGradient(0, 0, 0, 512);
eg.addColorStop(0, '#1c1530');
eg.addColorStop(0.4, '#0e0c18');
eg.addColorStop(1, '#06060c');
ex.fillStyle = eg;
ex.fillRect(0, 0, 1024, 512);

[
    [300, 120, 120, 'rgba(201,148,74,0.18)'],
    [700, 200, 90,  'rgba(201,148,74,0.12)'],
    [150, 380, 100, 'rgba(100,130,180,0.10)'],
    [850, 350, 80,  'rgba(180,140,100,0.08)']
].forEach(([x, y, r, c]) => {
    ex.fillStyle = c;
    ex.beginPath();
    ex.arc(x, y, Math.max(1, r), 0, Math.PI * 2);
    ex.fill();
});

const envTex = new THREE.CanvasTexture(ec);
envTex.mapping = THREE.EquirectangularReflectionMapping;
const envScene = new THREE.Scene();
envScene.background = envTex;
const envEl1 = new THREE.PointLight(0xc9944a, 8, 30);
envEl1.position.set(4, 4, 4);
envScene.add(envEl1);
const envEl2 = new THREE.PointLight(0x6688aa, 5, 30);
envEl2.position.set(-5, -2, 3);
envScene.add(envEl2);
scene.environment = pmrem.fromScene(envScene, 0.04).texture;
pmrem.dispose();

// ── Lighting ───────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x2a2030, 1.8));

const dirL = new THREE.DirectionalLight(0xffeedd, 1.8);
dirL.position.set(6, 8, 5);
scene.add(dirL);

const fillL = new THREE.DirectionalLight(0x8899bb, 0.5);
fillL.position.set(-5, -3, -5);
scene.add(fillL);

export const ptL1 = new THREE.PointLight(0xc9944a, 3, 25);
ptL1.position.set(5, 3, 4);
scene.add(ptL1);

export const ptL2 = new THREE.PointLight(0x5577aa, 2, 25);
ptL2.position.set(-4, -2, 4);
scene.add(ptL2);

// ── Orbit Controls ─────────────────────────────────────────────
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 22;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;
controls.maxPolarAngle = Math.PI * 0.72;
controls.minPolarAngle = Math.PI * 0.28;

// ── Texture Loader ─────────────────────────────────────────────
export const texLoader = new THREE.TextureLoader();

/** Attempts to load a cover image; falls back to a canvas-generated cover */
export function loadCoverTexture(coverPath, book) {
    return new Promise((resolve) => {
        texLoader.load(
            coverPath,
            (tex) => { tex.colorSpace = THREE.SRGBColorSpace; resolve(tex); },
            undefined,
            () => {
                console.warn(`Cover not found: ${coverPath} — generating fallback.`);
                const fallbackTex = new THREE.CanvasTexture(
                    createFallbackCover(book.title, book.author)
                );
                fallbackTex.colorSpace = THREE.SRGBColorSpace;
                resolve(fallbackTex);
            }
        );
    });
}

// ── Shared Geometries ──────────────────────────────────────────
export const COVER_W = 1.1;
export const COVER_H = 1.65;
export const hitGeo = new THREE.PlaneGeometry(COVER_W + 0.4, COVER_H + 0.4);
export const shardGeo = new THREE.OctahedronGeometry(0.04, 0);
export const dotGeo = new THREE.SphereGeometry(0.018, 8, 8);

// ── Shared Textures ────────────────────────────────────────────
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = 64;
spriteCanvas.height = 64;
const sctx = spriteCanvas.getContext('2d');
const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
sg.addColorStop(0, 'rgba(232,196,132,1.0)');
sg.addColorStop(0.3, 'rgba(201,148,74,0.5)');
sg.addColorStop(1, 'rgba(201,148,74,0.0)');
sctx.fillStyle = sg;
sctx.fillRect(0, 0, 64, 64);
export const spriteTex = new THREE.CanvasTexture(spriteCanvas);

const backGlowCanvas = document.createElement('canvas');
backGlowCanvas.width = 256;
backGlowCanvas.height = 384;
const bgCtx = backGlowCanvas.getContext('2d');
const bgGrad = bgCtx.createRadialGradient(128, 192, 20, 128, 192, 150);
bgGrad.addColorStop(0, 'rgba(201,148,74,0.35)');
bgGrad.addColorStop(0.5, 'rgba(201,148,74,0.08)');
bgGrad.addColorStop(1, 'rgba(201,148,74,0.0)');
bgCtx.fillStyle = bgGrad;
bgCtx.fillRect(0, 0, 256, 384);
export const backGlowTex = new THREE.CanvasTexture(backGlowCanvas);

export const accentColors = [
    0xc9944a, 0xe8c484, 0xaa7733, 0xdbc08a, 0xb8862e, 0xf0d49a
];

// ── Background Particles ──────────────────────────────────────
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(600 * 3);
for (let i = 0; i < 600; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 50;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    map: spriteTex,
    size: 0.18,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})));

// ── Connection Lines ───────────────────────────────────────────
export const linePositions = new Float32Array(200 * 6);
export const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
export const lineSegments = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({
        color: 0xc9944a,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
scene.add(lineSegments);

// ── Resize Handler ─────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});