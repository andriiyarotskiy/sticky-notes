import { memo, useCallback, useMemo, useRef } from "react"
import { DraggableBox, ColorSwatch, EditableText } from "@common"
import { useNoteActions } from "@features/sticky-notes/context/notes/useNotes"
import { rectsIntersect } from "@/utils/geometry"
import {
  MIN_NOTE_SIZE,
  NOTE_COLORS,
} from "@features/sticky-notes/model/constants"
import type { Note } from "@features/sticky-notes/model/types"
import type { Position, Rect, Size } from "@/types"
import "./StickyNote.css"

interface StickyNoteProps {
  note: Note
  bounds: Size
  /** Trash zone in surface coordinates, or null while it is unmeasured. */
  getTrashRect: () => Rect | null
  onTrashHoverChange: (noteId: string, isOver: boolean) => void
  isOverTrash: boolean
}

/**
 * A note is a DraggableBox plus the domain rules that a generic box must not
 * know about: which action a finished gesture dispatches, and whether the drop
 * happened over the trash zone.
 */
function StickyNote({
  note,
  bounds,
  getTrashRect,
  onTrashHoverChange,
  isOverTrash,
}: StickyNoteProps) {
  const {
    moveNote,
    resizeNote,
    removeNote,
    bringNoteToFront,
    setNoteColor,
    setNoteText,
  } = useNoteActions()

  const position = useMemo<Position>(
    () => ({ x: note.x, y: note.y }),
    [note.x, note.y],
  )
  const size = useMemo<Size>(
    () => ({ width: note.width, height: note.height }),
    [note.width, note.height],
  )

  // Measured once per gesture: the trash zone cannot move while a note is
  // being dragged, so re-reading it on every pointermove would only cost layout.
  const trashRectRef = useRef<Rect | null>(null)
  const wasOverTrashRef = useRef(false)

  const isOverTrashAt = useCallback(
    (position: Position) => {
      const trashRect = trashRectRef.current
      if (!trashRect) return false
      return rectsIntersect(
        { ...position, width: note.width, height: note.height },
        trashRect,
      )
    },
    [note.width, note.height],
  )

  const handleDragStart = useCallback(() => {
    trashRectRef.current = getTrashRect()
    wasOverTrashRef.current = false
  }, [getTrashRect])

  const handleDragMove = useCallback(
    (position: Position) => {
      const isOver = isOverTrashAt(position)
      // Only the boundary crossings reach React; the moves in between stay
      // entirely in the DOM.
      if (isOver === wasOverTrashRef.current) return
      wasOverTrashRef.current = isOver
      onTrashHoverChange(note.id, isOver)
    },
    [note.id, isOverTrashAt, onTrashHoverChange],
  )

  const handleDragEnd = useCallback(
    (position: Position) => {
      const dropsInTrash = isOverTrashAt(position)
      trashRectRef.current = null

      if (wasOverTrashRef.current) {
        wasOverTrashRef.current = false
        onTrashHoverChange(note.id, false)
      }

      if (dropsInTrash) {
        removeNote(note.id)
      } else {
        moveNote(note.id, position)
      }
    },
    [note.id, isOverTrashAt, onTrashHoverChange, removeNote, moveNote],
  )

  const handleResizeEnd = useCallback(
    (rect: Rect) => resizeNote(note.id, rect),
    [note.id, resizeNote],
  )

  const handleActivate = useCallback(
    () => bringNoteToFront(note.id),
    [note.id, bringNoteToFront],
  )

  const handleColorChange = useCallback(
    (color: string) => setNoteColor(note.id, color),
    [note.id, setNoteColor],
  )

  const handleTextChange = useCallback(
    (text: string) => setNoteText(note.id, text),
    [note.id, setNoteText],
  )

  return (
    <DraggableBox
      position={position}
      size={size}
      minSize={MIN_NOTE_SIZE}
      bounds={bounds}
      zIndex={note.zIndex}
      className={`sticky-note${isOverTrash ? " sticky-note--over-trash" : ""}`}
      onActivate={handleActivate}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onResizeEnd={handleResizeEnd}
    >
      <div
        className="sticky-note__paper"
        style={{ backgroundColor: note.color }}
      >
        <ColorSwatch
          className="sticky-note__colors"
          colors={NOTE_COLORS}
          value={note.color}
          onChange={handleColorChange}
        />
        <EditableText
          className="sticky-note__text"
          value={note.text}
          onChange={handleTextChange}
          placeholder="Type a note…"
          multiline
        />
      </div>
    </DraggableBox>
  )
}

export default memo(StickyNote)
