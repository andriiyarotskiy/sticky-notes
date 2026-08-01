import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { initialNotesState, notesReducer } from './notesReducer'
import { NoteActionsContext, NotesStateContext } from './notesContext'
import type { NoteActions } from './notesContext'

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialNotesState)

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
    }),
    [],
  )

  return (
    <NoteActionsContext.Provider value={actions}>
      <NotesStateContext.Provider value={state.notes}>
        {children}
      </NotesStateContext.Provider>
    </NoteActionsContext.Provider>
  )
}
