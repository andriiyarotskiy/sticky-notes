# Architecture

The codebase is organized by feature rather than by technical layer. Everything
that knows what a "note" is lives under `src/features/sticky-notes/`:
`components/` (Canvas, StickyNote, Toolbar, TrashZone), `context/notes/`
(reducer, contexts, provider, consumer hooks), `api/notesApi.ts` (the
persistence layer), and `model/` (the `Note` type and domain constants like
`MIN_NOTE_SIZE` and the color palette). Everything outside that folder —
`src/components/common/`, `src/hooks/`, `src/utils/`, and `src/types/` — is
generic and reusable on purpose: it has no notion of notes, sticky colors, or
a trash zone, only positions, sizes, and callbacks. This boundary is treated
as a hard rule rather than a convention: `common/` and `hooks/` contain zero
references to domain vocabulary, so any of it could be lifted into an
unrelated app unchanged.

The generic/domain split shows up most clearly in how a note is assembled.
`hooks/useDraggable` and `hooks/useResizable` are pure pointer-gesture
primitives — given a target ref and a starting geometry, they track a
pointer, apply an optional constraint function, and report a final
position/rect on release. `components/common/DraggableBox` composes both
hooks into a content-agnostic box with eight resize grips; it could carry any
child, not just a note. Domain meaning is added only at the top, in
`features/sticky-notes/components/StickyNote`, which wraps a `DraggableBox`
and decides what a finished gesture *means*: dropping on the trash zone
deletes the note, anything else commits a move. The same split applies to
`EditableText` and `ColorSwatch` in `components/common/` — both take a value
and an `onChange` and know nothing about notes — with `StickyNote` as the only
place that wires them to note-specific actions.

State lives in a single `useReducer` store (`features/sticky-notes/context/notes`)
exposed through two contexts instead of one: `NotesStateContext` carries the
note array, `NoteActionsContext` carries a memoized action object whose
identity never changes, since `dispatch` is stable. Components that only
dispatch — the toolbar, every gesture callback — read from
`useNoteActions()` and are structurally incapable of re-rendering when notes
change. The reducer also bails out to the same state reference on a no-op
update (a click that ends where it started, raising a note that's already on
top), and `StickyNote` is wrapped in `memo`, so moving one note never
re-renders its neighbors. The main trade-off behind this design is added
indirection — two contexts and a reducer instead of local `useState` — bought
back by that render isolation, which matters once a board can hold many
independently-draggable notes. A second, deliberate trade-off is that
gestures bypass React entirely while in flight: `pointermove` writes straight
to the DOM (`transform` for drags, box properties for resizes) and the
reducer only commits once, on release. That keeps dragging at zero renders,
but it means the DOM and React state can briefly disagree during a gesture,
which is why `DraggableBox` treats itself as the sole owner of the element's
geometry and re-applies committed props the moment a gesture ends. The
`localStorage`-backed "REST" layer in `notesApi.ts` makes the same kind of
trade: it's not a real network call, but every method is `async` with an
artificial delay specifically so the app can never rely on it resolving
synchronously — including the one place that trade-off almost bit us, where
notes created before the initial load resolved could be silently overwritten
by a stale snapshot; the provider now tracks whether local edits happened
before hydration and skips the stale dispatch if so.
