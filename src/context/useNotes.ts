import { useContext } from 'react'
import {
  NoteActionsContext,
  NotesStateContext,
  NotesSyncContext,
} from './notesContext'
import type { NoteActions, NotesSyncStatus } from './notesContext'
import type { Note } from '../types'

export function useNotes(): readonly Note[] {
  const notes = useContext(NotesStateContext)
  if (notes === null) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return notes
}

export function useNoteActions(): NoteActions {
  const actions = useContext(NoteActionsContext)
  if (actions === null) {
    throw new Error('useNoteActions must be used within a NotesProvider')
  }
  return actions
}

export function useNotesSyncStatus(): NotesSyncStatus {
  const status = useContext(NotesSyncContext)
  if (status === null) {
    throw new Error('useNotesSyncStatus must be used within a NotesProvider')
  }
  return status
}
