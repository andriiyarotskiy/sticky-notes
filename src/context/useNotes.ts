import { useContext } from 'react'
import { NoteActionsContext, NotesStateContext } from './notesContext'
import type { NoteActions } from './notesContext'
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
