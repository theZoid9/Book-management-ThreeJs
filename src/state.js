/* ================================================================
   SHARED MUTABLE STATE
   Centralises runtime state that multiple modules read and write
   (hover, raycasting results, 3D object registries, etc.)
   ================================================================ */

import * as THREE from 'three';

export const state = {
    /** Currently hovered book Group, or null */
    hoveredGroup: null,

    /** Normalised mouse coordinates updated every mousemove */
    mouse: new THREE.Vector2(-100, -100),

    /** Reusable raycaster (avoids allocating a new one each frame) */
    raycaster: new THREE.Raycaster(),

    /** All floating-book THREE.Group instances */
    sphereGroups: [],

    /** Invisible hitbox meshes used as raycaster targets */
    rayTargets: [],

    /** Whether the loading screen has been dismissed */
    loaded: false
};