import { createContext } from 'react'
import type { Note } from '@features/sticky-notes/model/types'
import type { Position, Rect } from '@/types'

export interface NoteActions {
  addNote: (rect: Rect) => void
  moveNote: (id: string, position: Position) => void
  resizeNote: (id: string, rect: Rect) => void
  removeNote: (id: string) => void
  bringNoteToFront: (id: string) => void
  setNoteColor: (id: string, color: string) => void
  setNoteText: (id: string, text: string) => void
}

export interface NotesSyncStatus {
  /** Message from the most recent failed background save, or null if clean. */
  error: string | null
  dismissError: () => void
}

/**
 * State and actions are kept in separate contexts on purpose: components that
 * only dispatch (toolbar, gesture callbacks) subscribe to a value that never
 * changes identity, so note updates never re-render them.
 */
export const NotesStateContext = createContext<readonly Note[] | null>(null)
export const NoteActionsContext = createContext<NoteActions | null>(null)
export const NotesSyncContext = createContext<NotesSyncStatus | null>(null)
