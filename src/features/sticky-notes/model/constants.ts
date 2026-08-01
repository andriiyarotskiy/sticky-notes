import type { Size } from "@/types"

/** Smallest a note may be shrunk to by dragging a resize grip. Wide enough to
 * keep all six color swatches from being clipped by the paper's padding. */
export const MIN_NOTE_SIZE: Size = { width: 150, height: 100 }

/** Fixed palette a note's color can be set to — tuned to stay vivid against
 * the dark cutting-mat canvas rather than washing out like pale pastels. */
export const NOTE_COLORS: readonly string[] = [
  "#ffd666",
  "#8fe3b0",
  "#7fcbef",
  "#f7a8c4",
  "#fbb169",
  "#c6aeef",
]
