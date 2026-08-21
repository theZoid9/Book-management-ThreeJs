Floating Library

A 3D interactive book library built with Three.js, bundled with Vite, deployed on Render.



---

## Prerequisites

- **Node.js** 18+ — [download](https://nodejs.org)
- A terminal

---

## First-Time Setup

```bash
# 1. Clone or download the project
cd floating-library

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

## Changing the 3D Scene Appearance

| What                       | Where                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| Fog color & density        | `src/sceneSetup.js` — `scene.fog = new THREE.FogExp2(...)`             |
| Background / environment   | `src/sceneSetup.js` — gradient stops in the environment canvas section |
| Light colors & positions   | `src/sceneSetup.js` — `ptL1`, `ptL2`, `dirL`, `fillL`, `AmbientLight`  |
| Book spread & spacing      | `src/bookBuilder.js` — `buildBooks()` → `spread = 5.0`                 |
| Floating speed & amplitude | `src/bookBuilder.js` — `createBookGroup()` → `speed` and `amp`         |
| Gold accent color          | `src/sceneSetup.js` — `accentColors` array                             |
| Particle count             | `src/sceneSetup.js` — `new Float32Array(600 * 3)`                      |

## Changing UI Text or Styling

| What                 | Where                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Detail panel HTML    | `index.html` — `#bookDetail` section                                                             |
| Read list panel HTML | `index.html` — `#readListOverlay` section                                                        |
| Add book modal HTML  | `index.html` — `#addModal` section                                                               |
| All CSS              | Your stylesheet — inline in `<style>` or linked `.css` file                                      |
| Button labels        | `src/interactions.js` — search for the label string in `setActionButton()`, `openDetail()`, etc. |

## Changing the Focus-Zoom Behavior

| What          | Where                                                             |
| ------------- | ----------------------------------------------------------------- |
| Zoom distance | `src/interactions.js` — `focusOnGroup()` → `.multiplyScalar(3.5)` |
| Zoom speed    | `src/animationLoop.js` — `updateFocus()` → `0.08`                 |
| Easing curve  | `src/animationLoop.js` — `smoothstep()` function                  |


# Development Workflow