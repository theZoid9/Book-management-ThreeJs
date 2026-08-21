/* ================================================================
   SHARED MUTABLE STATE
   Centralises runtime state that multiple modules read and write.
   ================================================================ */

import * as THREE from 'three';

export const state = {
    /** Currently hovered book Group, or null */
    hoveredGroup: null,

    /** Normalised mouse coordinates updated every mousemove */
    mouse: new THREE.Vector2(-100, -100),

    /** Reusable raycaster */
    raycaster: new THREE.Raycaster(),

    /** All floating-book THREE.Group instances */
    sphereGroups: [],

    /** Invisible hitbox meshes used as raycaster targets */
    rayTargets: [],

    /** Whether the loading screen has been dismissed */
    loaded: false,

    /* ── Focus / zoom-to-book state ─────────────────────────── */

    /** The Group currently being focused on (or null) */
    focusGroup: null,

    /** 0 = camera at original position, 1 = camera at focus position */
    focusLerp: 0,

    isFocusing: false,
    isUnfocusing: false,

    /** Pre-computed camera position when fully focused */
    focusCamPos: null,

    /** The book's basePos (centre of its float path) */
    focusBookPos: null,

    /** Camera state saved the moment focus begins */
    originalCamPos: null,
    originalTarget: null,

    /* ── Read-books tracking ────────────────────────────────── */

    /** Set of book titles the user has marked as read */
    readBooks: new Set()
};