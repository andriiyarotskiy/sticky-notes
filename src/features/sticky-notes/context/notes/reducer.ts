import { NOTE_COLORS } from "@features/sticky-notes/model/constants"
import type { Note } from "@features/sticky-notes/model/types"
import type { Position, Rect } from "@/types"

export interface NotesState {
  notes: Note[]
  nextId: number
  topZIndex: number
}

export type NotesAction =
  | { type: "notes/hydrated"; payload: { notes: Note[] } }
  | { type: "note/added"; payload: { rect: Rect } }
  | { type: "note/moved"; payload: { id: string; position: Position } }
  | { type: "note/resized"; payload: { id: string; rect: Rect } }
  | { type: "note/removed"; payload: { id: string } }
  | { type: "note/broughtToFront"; payload: { id: string } }
  | { type: "note/colorChanged"; payload: { id: string; color: string } }
  | { type: "note/textChanged"; payload: { id: string; text: string } }

export const initialNotesState: NotesState = {
  notes: [],
  nextId: 1,
  topZIndex: 0,
}

const NOTE_ID_PATTERN = /^note-(\d+)$/

function findNote(notes: readonly Note[], id: string): Note | undefined {
  return notes.find((candidate) => candidate.id === id)
}

function areNotesEqual(a: Note, b: Note): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.color === b.color &&
    a.text === b.text &&
    a.zIndex === b.zIndex
  )
}

/**
 * Finds the note by id and replaces it with `updater`'s result, bailing out
 * (returning the same `state` reference) if the note is missing or the
 * update is a no-op — shared by every action that patches a single note.
 */
function updateNote(
  state: NotesState,
  id: string,
  updater: (note: Note) => Note,
): NotesState {
  const note = findNote(state.notes, id)
  if (!note) return state

  const updated = updater(note)
  if (areNotesEqual(note, updated)) return state

  return {
    ...state,
    notes: state.notes.map((candidate) =>
      candidate.id === id ? updated : candidate,
    ),
  }
}

export function notesReducer(
  state: NotesState,
  action: NotesAction,
): NotesState {
  switch (action.type) {
    case "notes/hydrated": {
      const { notes } = action.payload
      let maxNumericId = 0
      let topZIndex = 0
      for (const note of notes) {
        const match = NOTE_ID_PATTERN.exec(note.id)
        if (match) maxNumericId = Math.max(maxNumericId, Number(match[1]))
        topZIndex = Math.max(topZIndex, note.zIndex)
      }
      return { notes, nextId: maxNumericId + 1, topZIndex }
    }

    case "note/added": {
      const zIndex = state.topZIndex + 1
      const note: Note = {
        ...action.payload.rect,
        id: `note-${state.nextId}`,
        color: NOTE_COLORS[(state.nextId - 1) % NOTE_COLORS.length],
        text: "",
        zIndex,
      }
      return {
        notes: [...state.notes, note],
        nextId: state.nextId + 1,
        topZIndex: zIndex,
      }
    }

    case "note/moved": {
      const { id, position } = action.payload
      return updateNote(state, id, (note) => ({ ...note, ...position }))
    }

    case "note/resized": {
      const { id, rect } = action.payload
      return updateNote(state, id, (note) => ({ ...note, ...rect }))
    }

    case "note/removed": {
      const { id } = action.payload
      if (!findNote(state.notes, id)) return state
      return {
        ...state,
        notes: state.notes.filter((candidate) => candidate.id !== id),
      }
    }

    case "note/broughtToFront": {
      const { id } = action.payload
      const note = findNote(state.notes, id)
      if (!note || note.zIndex === state.topZIndex) return state

      const zIndex = state.topZIndex + 1
      return {
        ...updateNote(state, id, (candidate) => ({ ...candidate, zIndex })),
        topZIndex: zIndex,
      }
    }

    case "note/colorChanged": {
      const { id, color } = action.payload
      return updateNote(state, id, (note) => ({ ...note, color }))
    }

    case "note/textChanged": {
      const { id, text } = action.payload
      return updateNote(state, id, (note) => ({ ...note, text }))
    }
  }
}
