# Shivi AI

A Hindi-first, fully local, emotionally intelligent personal AI assistant that behaves like a caring companion and operates like a human assistant on the user’s computer.

## Phase 1 Foundation
This repository contains the production-ready foundation architecture for Shivi AI:

- Electron + React desktop shell
- TypeScript + TailwindCSS UI
- Modular folder structure for core services, memory, vision, voice, reminders, and security
- Sidebar navigation for Chat, Memory, Reminders, Apps, Permissions, Voice, Personality, and Settings
- Local config and permission scaffolding
- Future-ready integration points for OCR, automation, voice, and local AI

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development mode:
   ```bash
   npm run dev
   ```
3. Build production artifacts:
   ```bash
   npm run build
   ```
4. Start the app after build:
   ```bash
   npm start
   ```

## Project structure

- `src/main/` — Electron main process and preload bridge
- `src/renderer/` — React UI, pages, components, and global styling
- `src/core/` — config, security, audit logging, and service loading
- `src/modules/` — placeholder engines for personality, reminders, vision, voice, automation, plugins, and system

## Notes
This phase is intentionally foundation-only. It focuses on clean architecture, offline-first reliability, and modular service-based design.

Future phases will add:
- Hindi conversation engine
- local memory and context
- OCR-driven app recall
- UI automation and screen reading
- voice wake words and expressive TTS
- smarter reminders and permissions
