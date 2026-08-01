import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createNote, deleteNote, fetchNotes, updateNote } from '../api/notesApi'
import { initialNotesState, notesReducer } from './notesReducer'
import {
  NoteActionsContext,
  NotesStateContext,
  NotesSyncContext,
} from './notesContext'
import type { NoteActions, NotesSyncStatus } from './notesContext'
import type { Note } from '../types'

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Baseline the sync effect diffs against. Seeded with the same array
  // reference the hydration dispatch uses, so the load itself is never
  // mistaken for a batch of creates (see the hydration effect below).
  const previousNotesRef = useRef<readonly Note[]>(initialNotesState.notes)

  useEffect(() => {
    let cancelled = false
    fetchNotes()
      .then((notes) => {
        if (cancelled) return
        previousNotesRef.current = notes
        dispatch({ type: 'notes/hydrated', payload: { notes } })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('Failed to load saved notes.', error)
        setSyncError('Could not load saved notes.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Persists every state change by diffing against the previous notes array.
  // This is the only place in the app that talks to api/notesApi, so create/
  // move/resize/recolor/retext/remove/reorder all sync through one path.
  useEffect(() => {
    const previous = previousNotesRef.current
    if (previous === state.notes) return

    const previousById = new Map(
      previous.map((note) => [note.id, note] as const),
    )
    const nextIds = new Set(state.notes.map((note) => note.id))

    const reportFailure = (action: string) => (error: unknown) => {
      console.error(`Failed to ${action} note.`, error)
      setSyncError(`Could not save your changes (${action} failed).`)
    }

    for (const note of previous) {
      if (!nextIds.has(note.id)) {
        void deleteNote(note.id).catch(reportFailure('delete'))
      }
    }
    for (const note of state.notes) {
      const previousNote = previousById.get(note.id)
      if (!previousNote) {
        void createNote(note).catch(reportFailure('create'))
      } else if (previousNote !== note) {
        void updateNote(note.id, note).catch(reportFailure('update'))
      }
    }

    previousNotesRef.current = state.notes
  }, [state.notes])

  // `dispatch` is stable, so the actions object is created once and never
  // invalidates consumers of NoteActionsContext.
  const actions = useMemo<NoteActions>(
    () => ({
      addNote: (rect) => dispatch({ type: 'note/added', payload: { rect } }),
      moveNote: (id, position) =>
        dispatch({ type: 'note/moved', payload: { id, position } }),
      resizeNote: (id, rect) =>
        dispatch({ type: 'note/resized', payload: { id, rect } }),
      removeNote: (id) => dispatch({ type: 'note/removed', payload: { id } }),
      bringNoteToFront: (id) =>
        dispatch({ type: 'note/broughtToFront', payload: { id } }),
      setNoteColor: (id, color) =>
        dispatch({ type: 'note/colorChanged', payload: { id, color } }),
      setNoteText: (id, text) =>
        dispatch({ type: 'note/textChanged', payload: { id, text } }),
    }),
    [],
  )

  const syncStatus = useMemo<NotesSyncStatus>(
    () => ({
      error: syncError,
      dismissError: () => setSyncError(null),
    }),
    [syncError],
  )

  return (
    <NoteActionsContext.Provider value={actions}>
      <NotesSyncContext.Provider value={syncStatus}>
        <NotesStateContext.Provider value={state.notes}>
          {children}
        </NotesStateContext.Provider>
      </NotesSyncContext.Provider>
    </NoteActionsContext.Provider>
  )
}
