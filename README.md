Floating Library

A 3D interactive book library built with Three.js, bundled with Vite, deployed on Render.



---

## Prerequisites

- **Node.js** 18+ — [download](https://nodejs.org)
- A terminal

---

## First-Time Setup


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
```

┌─────────────┐     edit files      ┌──────────────────┐
│  Your code  │ ──────────────────→  │  Vite dev server │
│  src/*.js   │                      │  localhost:5173   │
│  public/*   │  ← auto-refresh ──  │  (HMR active)    │
│  index.html │                      └──────────────────┘
└─────────────┘
```

1. Run npm run dev
2. Edit any file — the page updates instantly (Hot Module Replacement)
3. Open browser DevTools → Console to see [DB] and [APP] log messages
4. Test the full flow: hover, click, focus, read PDF, mark as read, add book, check read list
5. Close dev server with Ctrl+C

# Testing the production build locally

npm run build       # bundles everything into dist/
npm run preview     # serves dist/ at localhost:4173

Always test with preview before deploying — it exactly matches what Render will serve.

# Building for Production

npm run build

Output goes to dist/
```
dist/
├── index.html                  minified HTML
├── assets/
│   ├── index-xxxxxxxx.js        bundled JS (tree-shaken, minified)
│   └── index-xxxxxxxx.css       extracted CSS (if any)
├── covers/                      copied from public/
│   └── *.png
└── books/                       copied from public/
    └── *.pdf, *.epub
```

Never edit files in dist/ directly. They are regenerated on every build.

# Deploying to Render

Deploying to Render
One-time setup

    Push the project to a GitHub repository

    Go to dashboard.render.com

    Click New → Static Site

    Connect the GitHub repo

    Set:
    Field
    	
    Value
    Build Command	npm run build
    Publish Directory	dist
    Node Version	18


# Every update after that

git add .
git commit -m "description of changes"
git push

# What happens on Render's servers

```
npm install          ← installs three + vite
npm run build        ← vite bundles src/ into dist/
serve dist/          ← Render hosts the dist/ folder
```

Your public/covers/ and public/books/ are copied into dist/ during build, so book files are served at the correct paths.

# IndexedDB and Browser Storage

User-added books and the read-books list are stored in the browser's IndexedDB — not on the server. This means:

     Each browser/device has its own separate list
     Clearing browser data wipes saved books and read history
     No server-side database is needed
     The preloaded books in models.js always appear regardless of DB state

To debug DB issues, open DevTools → Console. You will see:

```
[DB] Opened successfully, version 2
[DB] Loaded 1 saved book(s) from store
[APP] Restored 1 book(s) from DB → sceneBooks now has 8 total

```

To wipe all user-saved books from the console:

```
(await import('/src/database.js')).db.clearAllBooks()
```

# File Change Cheat Sheet

| I want to... | Edit this file |
|---|---|
| Add/remove a preloaded book | `src/models.js` |
| Change a cover image | `public/covers/*.png` + path in `src/models.js` |
| Add/remove a PDF or EPUB | `public/books/*` + path in `src/models.js` |
| Change colors or lighting | `src/sceneSetup.js` |
| Change float speed or spacing | `src/bookBuilder.js` |
| Change zoom distance on click | `src/interactions.js` → `focusOnGroup()` |
| Change button text or labels | `src/interactions.js` |
| Change panel layout or styles | `index.html` + your CSS |
| Add a new UI panel | `index.html` (HTML) + `src/interactions.js` (logic) + CSS |
| Change DB schema | `src/database.js` (bump version in `indexedDB.open`) |
```