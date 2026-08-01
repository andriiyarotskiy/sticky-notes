import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import StickyNote from './StickyNote'
import Toolbar from './Toolbar'
import TrashZone from './TrashZone'
import { useNotes } from '../../context/useNotes'
import type { Rect, Size } from '../../types'
import './Canvas.css'

/**
 * Workspace shell. It owns the two pieces of layout information the domain
 * components need — the surface size used to clamp notes, and the trash zone
 * rect used for hit-testing — and keeps both in surface coordinates.
 */
function Canvas() {
  const notes = useNotes()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)

  const [bounds, setBounds] = useState<Size | null>(null)
  const [trashHoverNoteId, setTrashHoverNoteId] = useState<string | null>(null)

  useLayoutEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    const measure = () => {
      const { width, height } = surface.getBoundingClientRect()
      setBounds((current) =>
        current && current.width === width && current.height === height
          ? current
          : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(surface)
    return () => observer.disconnect()
  }, [])

  const getTrashRect = useCallback((): Rect | null => {
    const surface = surfaceRef.current
    const trash = trashRef.current
    if (!surface || !trash) return null

    const surfaceRect = surface.getBoundingClientRect()
    const trashRect = trash.getBoundingClientRect()
    return {
      x: trashRect.left - surfaceRect.left,
      y: trashRect.top - surfaceRect.top,
      width: trashRect.width,
      height: trashRect.height,
    }
  }, [])

  const handleTrashHoverChange = useCallback(
    (noteId: string, isOver: boolean) => {
      // Written on every pointermove but only ever changes value when a note
      // crosses the zone boundary, so React bails out of the rest.
      setTrashHoverNoteId((current) => {
        if (isOver) return noteId
        return current === noteId ? null : current
      })
    },
    [],
  )

  return (
    <div className="canvas">
      <Toolbar bounds={bounds ?? { width: 0, height: 0 }} />

      <div className="canvas__surface" ref={surfaceRef}>
        {bounds !== null &&
          notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              bounds={bounds}
              getTrashRect={getTrashRect}
              onTrashHoverChange={handleTrashHoverChange}
              isOverTrash={trashHoverNoteId === note.id}
            />
          ))}

        <TrashZone zoneRef={trashRef} isActive={trashHoverNoteId !== null} />
      </div>
    </div>
  )
}

export default Canvas
