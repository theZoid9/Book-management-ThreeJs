/* ================================================================
   ANIMATION LOOP
   Per-frame: book float, floater animation, raycasting,
   connection lines, light motion, render.
   ================================================================ */

import * as THREE from 'three';
import {
    scene, camera, renderer, controls,
    ptL1, ptL2, linePositions, lineGeo
} from './sceneSetup.js';
import { state } from './state.js';
import { hideLoader } from './bookBuilder.js';
import { updateHoverState } from './interactions.js';

// Fallback: hide loader after 6 s even if textures are slow
setTimeout(hideLoader, 6000);

const clock = new THREE.Clock();

// ── Connection-line update ─────────────────────────────────────
function updateLines() {
    let idx = 0;
    const groups = state.sphereGroups;
    for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
            if (idx >= 200) break;
            if (groups[i].position.distanceTo(groups[j].position) < 4.0) {
                const pi = groups[i].position;
                const pj = groups[j].position;
                const b  = idx * 6;
                linePositions[b]     = pi.x;
                linePositions[b + 1] = pi.y;
                linePositions[b + 2] = pi.z;
                linePositions[b + 3] = pj.x;
                linePositions[b + 4] = pj.y;
                linePositions[b + 5] = pj.z;
                idx++;
            }
        }
        if (idx >= 200) break;
    }
    for (let k = idx * 6; k < linePositions.length; k++) {
        linePositions[k] = 0;
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.setDrawRange(0, idx * 2);
}

// ── Main loop ──────────────────────────────────────────────────
export function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Animate each book group
    state.sphereGroups.forEach((group) => {
        const d = group.userData;

        // Entry animation
        if (!d.entered && t > d.entryDelay + 0.8) d.entered = true;
        const ease = d.entered ? (d.currentScale < 0.99 ? 0.06 : 0.1) : 0;
        d.currentScale += (d.targetScale - d.currentScale) * ease;

        // Floating motion
        if (d.entered) {
            group.position.set(
                d.basePos.x + Math.sin(t * d.speed + d.phase) * d.amp,
                d.basePos.y + Math.cos(t * d.speed * 0.7 + d.phaseY) * d.amp * 1.3,
                d.basePos.z + Math.sin(t * d.speed * 0.5 + d.phaseZ) * d.amp * 0.6
            );
        }

        group.scale.setScalar(Math.max(0.001, d.currentScale));

        // Billboarding: cover & glow always face the camera
        d.cover.quaternion.copy(camera.quaternion);
        d.backGlow.quaternion.copy(camera.quaternion);

        if (d.entered) {
            d.backGlow.material.opacity =
                d.baseBackGlowOpacity + Math.sin(t * 1.0 + d.phase) * 0.15;
        }

        // Floater animation
        d.floaters.forEach((f) => {
            const opacity =
                f.baseOpacity * (0.6 + 0.4 * Math.sin(t * f.pulseFreq + f.pulsePhase));
            const fx = Math.sin(t * f.freqX + f.phaseX) * f.rx;
            const fy = Math.cos(t * f.freqY + f.phaseY) * f.ry;
            const fz = Math.sin(t * f.freqZ + f.phaseZ) * f.rz;

            if (f.mesh) {
                f.mesh.position.set(fx, fy, fz);
                f.mesh.rotation.x = t * f.spinX;
                f.mesh.rotation.y = t * f.spinY;
                f.mesh.material.opacity = opacity;
            }
            if (f.sprite) {
                f.sprite.position.set(fx, fy, fz);
                f.sprite.material.opacity = opacity * 0.7;
            }
        });
    });

    // Raycasting → hover (delegates DOM updates to interactions module)
    state.raycaster.setFromCamera(state.mouse, camera);
    updateHoverState(state.raycaster.intersectObjects(state.rayTargets));

    // Connection lines
    updateLines();

    // Animated lights
    ptL1.position.x = Math.sin(t * 0.25) * 6;
    ptL1.position.y = Math.cos(t * 0.18) * 3 + 2;
    ptL2.position.x = Math.cos(t * 0.2) * 5;
    ptL2.position.z = Math.sin(t * 0.12) * 4 + 3;

    controls.update();
    renderer.render(scene, camera);
}