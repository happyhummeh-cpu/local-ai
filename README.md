# QEVRYN v0.1 Desktop Core
> **"Built by Veeomdecoders"**  
> A premium local-first AI intelligence layer and operating system designed for Windows and Linux laptops and desktops.

QEVRYN is an offline-first AI operating system that aggregates local compute providers, sandboxed coding loops, persistent memory, and document RAG indices into a unified intelligence plane. It is secure, private, and designed to protect cloud budgets, guaranteeing a **₹0 out-of-pocket** footprint.

---

## 🚀 Key Features

* **Local-First Isolation**: Conversations, notes, code trees, and vector chunks reside strictly on your Windows/Linux machine. No silent cloud syncing.
* **Core Adaptive Router**: Dynamically matches prompts to specific specialist cores (Reasoning Core, Coding Core, Medical Core, Law/Legal Core, Research Core).
* **Sandboxed Coding Agent**: Interactive Aider-style workspace terminal with active command scanners, blocking dangerous operations (`rm -rf`, `mkfs`) and displaying visual diffs for validation.
* **Consent-Based Update System**: Warns you of weight/index sizes prior to download. Support for metered data and Wi-Fi limit caps.
* **AWS Cost Guards**: Configured for `ap-south-1` (Asia Pacific Mumbai) region using hard token caps, budget alerts, and active buffers to target zero out-of-pocket spend.
* **Fully Audited Security**: Real-time auditing log tracing SSRF shield states, file changes, and validation milestones.
* **Trust and Legal Center**: 11 legally compliant markdown policies (Terms, Privacy, Disclaimers, Security policies) and 4 printable PDF editions included natively in the repository.

---

## 🛠️ Tech Stack & Architecture

QEVRYN is structured as a **Full-Stack Node.js (Vite + React + Express) Desktop Architecture**:
1. **Frontend**: Vite-powered React UI utilizing responsive Inter & Space Grotesk display typography and smooth Motion visual transitions.
2. **Backend Server**: Single unified Express.js process binding to local ports (`127.0.0.1`), facilitating RAG chunking, SQLite storage, sandbox security, and official `@google/genai` proxying.
3. **Bundler Engine**: esbuild bundling compiles the entire TypeScript backend server into a single standalone, lightning-fast file: `dist/server.cjs`.

---

## 📋 Folder Repository Structures

* `/server.ts` - Core full-stack backend APIs, security validators, and routing layers.
* `/src/App.tsx` - High-contrast premium desktop workspace layout, settings, and console visualizers.
* `/test-runner.js` - HTTP native integration test runner validating Core Cores.
* `/.github/workflows/ci.yml` - CI pipeline for compiling, bundling, and testing.
* `/legal/` & Root MDs - 11 legal Markdown deeds and 4 structured PDF print compliance files.

---

## 💻 Developer Commands & Setup

### 1. Installation
Install all base packages:
```bash
npm install
```

### 2. Launch Local Development Server
Boots Vite in middleware mode alongside the full-stack routing server on port `3000`:
```bash
npm run dev
```

### 3. Build & Bundle for Production
Vite builds the static React assets, and esbuild compiles `/server.ts` to `/dist/server.cjs` under native CommonJS:
```bash
npm run build
```

### 4. Execute Production Server
```bash
npm start
```

### 5. Run Integration Test Suite
```bash
node test-runner.js
```

---

## 📦 Desktop Packaging & Installers

### Windows (.exe / .msi)
To package QEVRYN into a single double-clickable setup executable, run Tauri or electron-builder compilation:
1. Verify SHA-256 checksums are registered inside `dist/server.cjs`.
2. Pack binaries using standard signing scripts.
3. Upon install, the app automatically places short-cuts in the Windows Start Menu and Desktop and lists itself in Add/Remove Programs.

### Linux (AppImage / .deb)
For Ubuntu/Debian compatibility:
1. Build an AppImage or generate a debian package with a valid Desktop Entry.
2. The desktop launcher is registered under `/usr/share/applications` with standard custom minimalist vector icons.

---

## 🛡️ Trust & Legal Documents
All legal parameters are stored directly in the repository for developer audit:
1. `TERMS_OF_SERVICE.md`
2. `PRIVACY_POLICY.md`
3. `SECURITY.md`
4. `DATA_PROCESSING.md`
5. `MODEL_LICENSES.md`
6. `THIRD_PARTY_NOTICES.md`
7. `RESPONSIBLE_AI_POLICY.md`
8. `MEDICAL_LEGAL_DISCLAIMER.md`
9. `CONTRIBUTING.md`
10. `CODE_OF_CONDUCT.md`
11. `SECURITY_WHITEPAPER.md`

PDF editions:
* `QEVRYN_Terms_of_Service.pdf`
* `QEVRYN_Privacy_Policy.pdf`
* `QEVRYN_Security_Whitepaper.pdf`
* `QEVRYN_Responsible_AI_Policy.pdf`

---
*Built with professional integrity by Veeomdecoders.*
