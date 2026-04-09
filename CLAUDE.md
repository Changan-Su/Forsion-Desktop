# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forsion Desktop — a macOS-style AI desktop web application. Pure client-side React app that connects to the shared Forsion Backend Service for auth and AI chat. Part of the Forsion monorepo (`apps/Forsion-Desktop`).

Tech stack: React 19 + TypeScript, Vite, Framer Motion, @dnd-kit, Lucide icons. No CSS framework — uses inline styles and CSS variables for theming. No router — single-page desktop metaphor with a window manager.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 2005, configurable via VITE_PORT)
npm run build        # Production build
npm run preview      # Preview production build
./start-dev.sh       # Linux/Mac: checks backend health then runs dev
```

No test framework is configured. No linter is configured.

## Environment Variables

Create `.env.local` in project root:
```
VITE_API_URL=http://localhost:3001    # Backend service URL
VITE_PROJECT_SOURCE=desktop           # Project source identifier
VITE_PORT=2005                        # Dev server port (optional)
```

The backend (Forsion Backend Service) must be running separately — this app has no local backend.

## Architecture

### Entry Flow

`index.html` → `index.tsx` → `App.tsx` — App.tsx is the root component that orchestrates everything: authentication state, window management, theme application, and keyboard shortcuts (Ctrl+K opens AI Chat).

### State Management

No state library. All state lives in React hooks (useState/useEffect) within components, plus:
- **localStorage** — auth tokens (`auth_token`, `auth_user`), user settings
- **IndexedDB** (`forsion_desktop_db`) — chat sessions and messages, per-user isolation
- **Custom DOM events** — `gpu-acceleration-changed` for cross-component GPU toggle sync

### Service Layer (`services/`)

Services are singleton-pattern modules (not classes with instances — static methods or exported functions):

- **apiService.ts** — Base HTTP client. Attaches `Authorization: Bearer` header and `X-Project-Source: desktop`. Supports SSE streaming via `fetchSSE()`.
- **authRedirect.ts** — Handles auth flow: validates token on startup, redirects to unified login page if invalid, processes callback tokens. This is the auth entry point, not authService.
- **authService.ts** — Lower-level token/user storage in localStorage.
- **chatService.ts** — Chat completions via OpenAI-compatible endpoint (`POST /api/chat/completions`). Supports both streaming (SSE) and non-streaming modes.
- **sessionStorageService.ts** — IndexedDB wrapper for chat sessions/messages. Each user gets isolated data.
- **settingsStorageService.ts** — User preferences persistence (GPU acceleration, theme).
- **forsionDeskService.ts** — Forsion app marketplace integration (install/uninstall third-party apps).

### Component Layer (`components/`)

Desktop metaphor UI:
- **WindowManager.tsx** — Renders open windows with drag/resize/z-index management
- **Dock.tsx** — Bottom app launcher bar with @dnd-kit sortable reordering
- **Launchpad.tsx** — Grid app launcher overlay
- **AIChat.tsx** — Full chat interface with session management, model selection, streaming display
- **UserSettingsModal.tsx** — Profile editing, phone display, recharge/credits
- **AppMarket.tsx / ForsionDeskMarket.tsx** — App marketplace browsing and installation
- **WidgetBoard.tsx** — Desktop widget dashboard

### Theme System

Three built-in themes defined in `constants.tsx`. Applied via CSS variables on `document.documentElement`: `--color-primary`, `--color-secondary`, `--color-text`, `--glass-surface`, `--bg-desktop`. Components read these variables for consistent styling.

### API Contract

Backend base URL from `VITE_API_URL` (default `http://localhost:3001`). Key endpoints:
- Auth: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- Chat: `POST /api/chat/completions` (OpenAI-compatible format, supports streaming via SSE)
- Health: `GET /api/health`

SSE streaming passes token as query param (`?token=...`); REST uses `Authorization` header.

### Type System

- `types.ts` — Frontend types: `AppId`, `Theme`, `WindowState`, `DesktopApp`, `ChatMessage`
- `types/shared.ts` — Backend contract types: `User`, `Session`, `Message`, `AIModel`, `ChatRequest`/`ChatResponse`

### Deployment

Multi-stage Docker build (`Dockerfile.frontend`): Node 20 Alpine builds, Nginx Alpine serves. `nginx.conf` reverse-proxies `/api` to the backend at `http://172.17.0.1:3001`. Production port is 80 inside container, mapped to 2005 via docker-compose.

### Path Alias

`@/*` maps to the project root (configured in both `vite.config.ts` and `tsconfig.json`).
