# Sticky Notes

A single-page sticky notes application built with React, TypeScript, and
Vite.

## Features

- Create a note of a specified size at a specified position (toolbar)
- Move a note by dragging it
- Resize a note by dragging any of its eight edges/corners
- Delete a note by dropping it on the trash zone
- Bring a note to front by clicking/dragging it
- Edit a note's text inline (double-click to enter, blur/Enter to commit,
  Escape to cancel)
- Recolor a note from a fixed palette
- Notes persist to `localStorage` through a fake async REST layer and are
  restored on page load

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
  api/             fake async REST layer, backed by localStorage
  components/
    notes/         domain components: StickyNote, Canvas, TrashZone, Toolbar
    ui/            generic primitives: DraggableBox, NumberField,
                    EditableText, ColorSwatch
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

Text editing and colour selection follow the same generic/domain split as
everything else: `components/ui/EditableText` and `components/ui/ColorSwatch`
know nothing about notes — they take a value and an `onChange`, nothing more —
and `StickyNote` is the only place that wires them to `useNoteActions()`. The
one subtlety is making these controls coexist with a draggable parent.
Naively stopping `pointerdown` propagation on their whole idle surface breaks
the "move a note by dragging" requirement, since the text area covers most of
the note; instead only the elements that actually consume the interaction —
the focused input, and each individual swatch button — opt out of the drag,
so grabbing anywhere else on the note still starts a move. Detecting a
double-click to enter edit mode is done by hand, on `pointerdown` timing and
position, rather than the native `dblclick` event: `setPointerCapture` (used
by the drag gesture) interferes with the browser's own double-click
synthesis, and swapping to the input synchronously mid-`pointerdown` orphans
the original target and triggers a stray blur — so activation is detected on
`pointerdown` but only applied on the following `click`, once the native
event sequence has safely finished.

Persistence (bonus III + V) is a single fake REST module, `api/notesApi.ts`:
`fetchNotes`/`createNote`/`updateNote`/`deleteNote`, each `async` and backed
by `localStorage`, with an artificial `setTimeout` delay so the app can never
accidentally depend on it resolving synchronously. `NotesProvider` is the only
consumer — no component talks to `localStorage` or the API module directly.
On mount it calls `fetchNotes()` and hydrates the reducer; on every
subsequent state change it diffs the new notes array against the previous one
(by id) and fires the matching create/update/delete calls. This keeps the
reducer itself completely free of side effects — it doesn't know persistence
exists — while still syncing every kind of change (move, resize, recolour,
retext, reorder, remove) through one code path. A failed save surfaces through
a small `NotesSyncContext` as a dismissible banner rather than failing
silently.
