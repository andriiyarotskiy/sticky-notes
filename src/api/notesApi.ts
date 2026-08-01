import type { Note } from '../types'

const STORAGE_KEY = 'sticky-notes/notes:v1'
const SIMULATED_LATENCY_MS = 200

function readStore(): Note[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Note[]
  } catch (error) {
    // Corrupted or foreign data under this key is a boundary condition, not a
    // bug in this app — fall back to an empty store rather than crashing.
    console.warn('Ignoring unreadable persisted notes.', error)
    return []
  }
}

function writeStore(notes: readonly Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS)
  })
}

/**
 * Fake async REST layer: the same call shape a real `fetch`-based client
 * would have, backed by localStorage instead of a network. Every method
 * is `async` (rather than returning a plain value) so a synchronous write
 * failure — e.g. a full quota — surfaces as a rejected promise like a real
 * request would, instead of throwing out of the caller unexpectedly.
 */
export async function fetchNotes(): Promise<Note[]> {
  return delay(readStore())
}

export async function createNote(note: Note): Promise<Note> {
  writeStore([...readStore(), note])
  return delay(note)
}

export async function updateNote(id: string, note: Note): Promise<Note> {
  const notes = readStore()
  const index = notes.findIndex((candidate) => candidate.id === id)
  if (index === -1) {
    throw new Error(`Cannot update note "${id}": not found`)
  }
  const next = [...notes]
  next[index] = note
  writeStore(next)
  return delay(note)
}

export async function deleteNote(id: string): Promise<void> {
  writeStore(readStore().filter((candidate) => candidate.id !== id))
  return delay(undefined)
}
