import { useState } from 'react'
import NumberField from '../ui/NumberField'
import { useNoteActions } from '../../context/useNotes'
import { clampRectToBounds } from '../../utils/geometry'
import { MIN_NOTE_SIZE } from './noteConstants'
import type { Rect, Size } from '../../types'
import './Toolbar.css'

const DEFAULT_DRAFT: Rect = { x: 40, y: 40, width: 220, height: 180 }

interface ToolbarProps {
  bounds: Size
}

/** Creates a note of an explicitly specified size at an explicit position. */
function Toolbar({ bounds }: ToolbarProps) {
  const { addNote } = useNoteActions()
  const [draft, setDraft] = useState<Rect>(DEFAULT_DRAFT)

  const updateDraft = (patch: Partial<Rect>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = () => {
    addNote(clampRectToBounds(draft, bounds, MIN_NOTE_SIZE))
    // Offset the next note so repeated clicks do not stack notes exactly.
    updateDraft({ x: draft.x + 24, y: draft.y + 24 })
  }

  return (
    <div className="toolbar">
      <span className="toolbar__title">Sticky Notes</span>

      <div className="toolbar__fields">
        <NumberField
          label="X"
          value={draft.x}
          min={0}
          onChange={(x) => updateDraft({ x })}
        />
        <NumberField
          label="Y"
          value={draft.y}
          min={0}
          onChange={(y) => updateDraft({ y })}
        />
        <NumberField
          label="Width"
          value={draft.width}
          min={MIN_NOTE_SIZE.width}
          onChange={(width) => updateDraft({ width })}
        />
        <NumberField
          label="Height"
          value={draft.height}
          min={MIN_NOTE_SIZE.height}
          onChange={(height) => updateDraft({ height })}
        />
      </div>

      <button className="toolbar__button" type="button" onClick={handleSubmit}>
        Add note
      </button>

      <span className="toolbar__hint">
        Drag to move · pull the edges to resize · drop on the trash to delete
      </span>
    </div>
  )
}

export default Toolbar
