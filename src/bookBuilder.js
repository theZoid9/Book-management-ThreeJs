/* ================================================================
   3D FLOATING BOOK CONSTRUCTION
   Builds initial books (fibonacci-sphere layout) and injects
   dynamically-added books at random positions.
   ================================================================ */

import * as THREE from 'three';
import {
    scene, loadCoverTexture, hitGeo, shardGeo, dotGeo,
    spriteTex, backGlowTex, COVER_W, COVER_H, accentColors
} from './sceneSetup.js';
import { state } from './state.js';
import { sceneBooks } from './models.js';

// ── Loader dismissal ───────────────────────────────────────────
export function hideLoader() {
    if (state.loaded) return;
    state.loaded = true;
    document.getElementById('loader').classList.add('hidden');
}

// ── Build all initial books ────────────────────────────────────
export async function buildBooks() {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const basePositions = [];
    const total = sceneBooks.length;

    // Fibonacci-sphere distribution
    for (let i = 0; i < total; i++) {
        const y = 1 - (i / (total - 1 || 1)) * 2;
        const rAtY = Math.sqrt(Math.max(0.001, 1 - y * y));
        const theta = goldenAngle * i;
        const spread = 5.0 + (Math.random() - 0.5) * 1.0;
        basePositions.push(new THREE.Vector3(
            Math.cos(theta) * rAtY * spread,
            y * spread * 0.65,
            Math.sin(theta) * rAtY * spread - 1.5
        ));
    }

    for (let i = 0; i < total; i++) {
        const book = sceneBooks[i];
        const pos = basePositions[i];
        await createBookGroup(book, pos, i * 0.08, false);
    }

    hideLoader();
}

// ── Inject a single dynamically-added book ─────────────────────
export async function addBookToScene(book) {
    const pos = getRandomSpherePoint(5.5);
    await createBookGroup(book, pos, 0, true);
}

// ── Internal: create one book Group and register it ────────────
async function createBookGroup(book, pos, entryDelay, enteredImmediately) {
    const i = state.sphereGroups.length;
    const group = new THREE.Group();
    group.position.copy(pos);
    group.scale.setScalar(0.001);

    // Back glow
    const backGlowMat = new THREE.MeshBasicMaterial({
        map: backGlowTex, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const backGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(COVER_W * 2.2, COVER_H * 2.2), backGlowMat
    );
    backGlow.position.z = -0.01;
    group.add(backGlow);

    // Cover plane
    const coverTex = await loadCoverTexture(book.cover, book);
    const coverMat = new THREE.MeshStandardMaterial({
        map: coverTex, roughness: 0.4, metalness: 0.0, side: THREE.DoubleSide
    });
    const coverMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(COVER_W, COVER_H), coverMat
    );
    group.add(coverMesh);

    // Invisible hitbox
    const hitbox = new THREE.Mesh(
        hitGeo, new THREE.MeshBasicMaterial({ visible: false })
    );
    group.add(hitbox);

    // Decorative floaters (shards + dots + sprites)
    const groupFloaters = createFloaters(group, accentColors[i % accentColors.length]);

    // Metadata stored on the Group
    group.userData = {
        idx: i,
        book,
        basePos: pos.clone(),
        phase:    Math.random() * Math.PI * 2,
        phaseY:   Math.random() * Math.PI * 2,
        phaseZ:   Math.random() * Math.PI * 2,
        speed:    0.25 + Math.random() * 0.25,
        amp:      0.15 + Math.random() * 0.18,
        cover: coverMesh,
        hitbox,
        backGlow,
        floaters: groupFloaters,
        targetScale: 1,
        currentScale: 0.001,
        entryDelay,
        entered: enteredImmediately,
        baseBackGlowOpacity: 0.6
    };

    scene.add(group);
    state.sphereGroups.push(group);
    state.rayTargets.push(hitbox);
}

// ── Internal: attach shard / dot / sprite floaters to a group ──
function createFloaters(group, accent) {
    const floaters = [];

    // 5 shards + 5 dots
    for (let f = 0; f < 10; f++) {
        const isShard = f < 5;
        const mesh = new THREE.Mesh(
            isShard ? shardGeo : dotGeo,
            new THREE.MeshBasicMaterial({
                color: accent, transparent: true,
                opacity: isShard ? 0.45 : 0.65
            })
        );
        if (isShard) {
            mesh.scale.set(
                0.8 + Math.random() * 2.5,
                0.6 + Math.random() * 1.5,
                0.6 + Math.random() * 1.5
            );
        }
        group.add(mesh);
        floaters.push(makeFloaterData(mesh, isShard ? 0.45 : 0.65));
    }

    // 4 additive sprites
    for (let s = 0; s < 4; s++) {
        const opacity = 0.12 + Math.random() * 0.15;
        const spriteMat = new THREE.SpriteMaterial({
            map: spriteTex, transparent: true, opacity,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(
            0.2 + Math.random() * 0.35,
            0.2 + Math.random() * 0.35,
            1
        );
        group.add(sprite);
        floaters.push(makeFloaterData(sprite, opacity));
    }

    return floaters;
}

/** Generates the randomised oscillation parameters for one floater */
function makeFloaterData(obj, baseOpacity) {
    return {
        mesh: obj.isMesh ? obj : undefined,
        sprite: obj.isSprite ? obj : undefined,
        rx: 0.6 + Math.random() * 0.9,
        ry: 0.5 + Math.random() * 0.8,
        rz: 0.5 + Math.random() * 0.7,
        freqX:  0.08 + Math.random() * 0.35,
        freqY:  0.1  + Math.random() * 0.3,
        freqZ:  0.07 + Math.random() * 0.25,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        spinX:  (Math.random() - 0.5) * 1.5,
        spinY:  (Math.random() - 0.5) * 1.5,
        baseOpacity,
        pulseFreq:  0.3 + Math.random() * 0.7,
        pulsePhase: Math.random() * Math.PI * 2
    };
}

/** Random point on a unit sphere, scaled and offset to match the scene */
function getRandomSpherePoint(radius) {
    let x, y, z;
    do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    return new THREE.Vector3(x * radius, y * radius * 0.65, z * radius - 1.5);
}