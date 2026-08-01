import type { Note, Position, Rect } from '../types'

export const NOTE_COLORS: readonly string[] = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#fed7aa',
  '#ddd6fe',
]

export interface NotesState {
  notes: Note[]
  nextId: number
  topZIndex: number
}

export type NotesAction =
  | { type: 'note/added'; payload: { rect: Rect } }
  | { type: 'note/moved'; payload: { id: string; position: Position } }
  | { type: 'note/resized'; payload: { id: string; rect: Rect } }
  | { type: 'note/removed'; payload: { id: string } }
  | { type: 'note/broughtToFront'; payload: { id: string } }

export const initialNotesState: NotesState = {
  notes: [],
  nextId: 1,
  topZIndex: 0,
}

export function notesReducer(
  state: NotesState,
  action: NotesAction,
): NotesState {
  switch (action.type) {
    case 'note/added': {
      const zIndex = state.topZIndex + 1
      const note: Note = {
        ...action.payload.rect,
        id: `note-${state.nextId}`,
        color: NOTE_COLORS[(state.nextId - 1) % NOTE_COLORS.length],
        zIndex,
      }
      return {
        notes: [...state.notes, note],
        nextId: state.nextId + 1,
        topZIndex: zIndex,
      }
    }

    case 'note/moved': {
      const { id, position } = action.payload
      const note = state.notes.find((candidate) => candidate.id === id)
      // A click without movement commits the position it started from; bailing
      // out keeps that from re-rendering the note for nothing.
      if (!note || (note.x === position.x && note.y === position.y)) {
        return state
      }
      return {
        ...state,
        notes: state.notes.map((candidate) =>
          candidate.id === id
            ? { ...candidate, x: position.x, y: position.y }
            : candidate,
        ),
      }
    }

    case 'note/resized': {
      const { id, rect } = action.payload
      const note = state.notes.find((candidate) => candidate.id === id)
      if (
        !note ||
        (note.x === rect.x &&
          note.y === rect.y &&
          note.width === rect.width &&
          note.height === rect.height)
      ) {
        return state
      }
      return {
        ...state,
        notes: state.notes.map((candidate) =>
          candidate.id === id ? { ...candidate, ...rect } : candidate,
        ),
      }
    }

    case 'note/removed': {
      const { id } = action.payload
      if (!state.notes.some((candidate) => candidate.id === id)) return state
      return {
        ...state,
        notes: state.notes.filter((candidate) => candidate.id !== id),
      }
    }

    case 'note/broughtToFront': {
      const { id } = action.payload
      const note = state.notes.find((candidate) => candidate.id === id)
      if (!note || note.zIndex === state.topZIndex) return state

      const zIndex = state.topZIndex + 1
      return {
        ...state,
        topZIndex: zIndex,
        notes: state.notes.map((candidate) =>
          candidate.id === id ? { ...candidate, zIndex } : candidate,
        ),
      }
    }
  }
}
