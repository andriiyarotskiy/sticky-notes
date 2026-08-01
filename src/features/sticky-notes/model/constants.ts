import type { Size } from '@/types'

/** Smallest a note may be shrunk to by dragging a resize grip. */
export const MIN_NOTE_SIZE: Size = { width: 120, height: 100 }

/** Fixed palette a note's color can be set to. */
export const NOTE_COLORS: readonly string[] = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#fed7aa',
  '#ddd6fe',
]
