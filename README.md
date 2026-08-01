# Sticky Notes

A single-page sticky notes application built with React, TypeScript, and
Vite.

## Features

- Create a note of a specified size at a specified position (toolbar)
- Move a note by dragging it
- Resize a note by dragging any of its eight edges/corners
- Delete a note by dropping it on the trash zone
- Bring a note to front on click, and per-note colours

Notes are kept inside the canvas and cannot be shrunk below 120×100.

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
    ui/            generic primitives: DraggableBox, NumberField
  context/         notes state: reducer, contexts, provider, consumer hooks
  hooks/           generic, domain-agnostic hooks: useDraggable, useResizable
  types/           shared TypeScript types
  utils/           pure geometry and hit-testing helpers
```

## Architecture

The code is split into three layers that never reach upwards. At the bottom
sit pure functions (`utils/geometry.ts`) and generic gesture hooks
(`hooks/useDraggable`, `hooks/useResizable`). The hooks speak only in
positions, sizes and callbacks; they take a target element ref and a few
constraints, and know nothing about notes, trash zones or application state.
All the arithmetic they need — clamping to bounds, translating a pointer
delta into a new rect for a given resize grip, minimum-size handling — lives
in `utils/geometry.ts` as pure, React-free functions, which keeps the tricky
maths independently testable. In the middle sits `components/ui/DraggableBox`,
a content-agnostic box that composes both hooks and renders the eight resize
grips; it accepts arbitrary children and could carry any widget. Domain
meaning is added only at the top, in `components/notes/StickyNote`, which
wraps a `DraggableBox` and decides what a finished gesture means: a drop over
the trash zone deletes the note, anything else moves it.

State lives in a `useReducer` store exposed through two separate contexts.
`NotesStateContext` carries the note array; `NoteActionsContext` carries a
memoised action object whose identity never changes because `dispatch` is
stable. Components that only write — the toolbar, and every gesture callback —
subscribe via `useNoteActions()` and are therefore never re-rendered by note
updates. The reducer also returns the previous state unchanged when an action
would be a no-op (a click that commits the position it started from, or
raising a note that is already on top), so idempotent gestures cost nothing.
`StickyNote` is wrapped in `memo`, and the canvas passes it only stable
callbacks, so moving one note never re-renders its neighbours.

Performance during a gesture is handled by keeping React out of the loop
entirely. On `pointerdown` the hooks capture the pointer, record the starting
geometry and attach `pointermove`/`pointerup` listeners imperatively; every
subsequent move writes straight to the DOM node — a `transform` for moves, box
properties for resizes — so dragging a note costs zero renders. State is
committed once, on release. Because both React and the gestures would
otherwise write the same style properties, `DraggableBox` is the single owner
of the element's geometry: a layout effect re-applies the committed props
whenever a gesture ends, which also covers the case where a gesture finishes
on the values it started from and React would skip the update. Trash
hit-testing follows the same principle — the zone is measured once per drag
and the boolean result is pushed into React only when the note actually
crosses the boundary, so the highlight costs one render per crossing rather
than one per pointer move.
