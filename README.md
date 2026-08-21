Floating Library

A 3D interactive book library built with Three.js, bundled with Vite, deployed on Render.


Project Structure

├── index.html                  Entry HTML — loads src/main.js
├── package.json                Dependencies & scripts
├── vite.config.js              Vite build configuration
├── .gitignore                  Ignores node_modules/ and dist/
│
├── public/                     Static assets — copied as-is into the build
│   ├── covers/                 Book cover images (PNG, JPG, WEBP)
│   │   ├── pworlds.png
│   │   ├── don.png
│   │   ├── logi.png
│   │   ├── green.png
│   │   ├── astro.png
│   │   ├── money.png
│   │   └── react.png
│   └── books/                  Book files (PDF, EPUB)
│       ├── pworlds.pdf
│       ├── TheDon(Roland Perry).pdf
│       ├── being.pdf
│       ├── green.epub
│       ├── astro.epub
│       ├── money.epub
│       └── react.pdf
│
└── src/                        JavaScript modules — bundled by Vite
    ├── main.js                 Entry point: init DB → load books → start 3D
    ├── models.js               Book/Member classes + preloaded data + cover paths
    ├── database.js             IndexedDB wrapper (saved books + read list)
    ├── coverGenerator.js       Canvas-drawn fallback when cover image is missing
    ├── sceneSetup.js           Three.js scene, camera, lights, controls, shared geos
    ├── state.js                Shared mutable state (hover, focus, read list)
    ├── bookBuilder.js          Creates 3D book groups (initial + dynamically added)
    ├── interactions.js         UI: raycasting, detail panel, reader, modals, read list
    └── animationLoop.js        Per-frame render loop, float animation, focus zoom