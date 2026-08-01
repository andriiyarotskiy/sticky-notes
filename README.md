# Sticky Notes

A single-page sticky notes application built with React, TypeScript, and
Vite.

> **Status:** project scaffolding only. No sticky-note features (create,
> move, resize, delete) are implemented yet.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173) in a
desktop browser. Minimum supported viewport: 1024×768.

## Build

```bash
npm run build
```

Compiles TypeScript and produces a production build in `dist/`.

```bash
npm run preview
```

Serves the production build locally for a final check.

## Lint & format

```bash
npm run lint          # ESLint
npm run format        # Prettier — write
npm run format:check  # Prettier — check only
```

## Project structure

```
src/
  api/             fake async REST layer (added later)
  components/
    notes/         domain components: StickyNote, Canvas, TrashZone, Toolbar
    ui/            generic, reusable UI primitives
  context/         NotesContext + reducer
  hooks/           generic, domain-agnostic hooks (e.g. useDraggable, useResizable)
  types/           shared TypeScript types
  utils/           pure geometry/collision helper functions
```

## Architecture

_To be written as features are implemented._
