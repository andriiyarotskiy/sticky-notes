import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import "./EditableText.css"

const DOUBLE_CLICK_WINDOW_MS = 400
const DOUBLE_CLICK_RADIUS_PX = 6

export interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Renders a textarea instead of a single-line input. */
  multiline?: boolean
  activateOn?: "click" | "doubleClick"
  className?: string
  disabled?: boolean
}

/**
 * Generic inline-edit text: shows plain text until activated, then swaps in a
 * focused input. Commits on blur or Enter (Shift+Enter inserts a newline in
 * multiline mode); Escape cancels and restores the value it started with.
 *
 * The idle display only claims a pointerdown once it recognizes an actual
 * activation gesture (single or double click, depending on `activateOn`);
 * anything else — a plain click-and-drag — passes through untouched, so this
 * can sit inside a draggable container and still leave it fully draggable.
 * Detection is done by hand on `pointerdown` timing and position rather than
 * the native `dblclick` event, which a draggable ancestor's
 * `setPointerCapture` would otherwise interfere with. Position matters as
 * much as timing: without it, clicking a note, dragging it elsewhere, and
 * clicking it again in quick succession would misread as a double-click
 * (same element, both pointerdowns close in time) instead of two unrelated
 * single clicks — requiring both pointerdowns to land near the same spot is
 * what tells them apart. Activation itself waits for the follow-up
 * `click` rather than swapping to the input straight from `pointerdown`:
 * doing that swap synchronously, mid-dispatch, orphans the original target
 * and the browser fires a stray compatibility `mousedown` on the parent,
 * which reads as "clicked outside" and blurs the input it just focused.
 */
function EditableText({
  value,
  onChange,
  placeholder,
  multiline = false,
  activateOn = "doubleClick",
  className,
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastPointerDownRef = useRef({ time: 0, x: 0, y: 0 })
  const pendingActivationRef = useRef(false)

  useEffect(() => {
    if (!isEditing) return
    const element = multiline ? textareaRef.current : inputRef.current
    element?.focus()
    element?.select()
  }, [isEditing, multiline])

  const startEditing = () => {
    if (disabled) return
    setDraft(value)
    setIsEditing(true)
  }

  const commit = () => {
    setIsEditing(false)
    if (draft !== value) onChange(draft)
  }

  const cancel = () => {
    setIsEditing(false)
    setDraft(value)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return

    if (activateOn === "click") {
      event.stopPropagation()
      pendingActivationRef.current = true
      return
    }

    const last = lastPointerDownRef.current
    const isDoubleClick =
      event.timeStamp - last.time < DOUBLE_CLICK_WINDOW_MS &&
      Math.abs(event.clientX - last.x) < DOUBLE_CLICK_RADIUS_PX &&
      Math.abs(event.clientY - last.y) < DOUBLE_CLICK_RADIUS_PX
    lastPointerDownRef.current = isDoubleClick
      ? { time: 0, x: 0, y: 0 }
      : { time: event.timeStamp, x: event.clientX, y: event.clientY }

    if (isDoubleClick) {
      event.stopPropagation()
      pendingActivationRef.current = true
    }
  }

  const handleClick = () => {
    if (!pendingActivationRef.current) return
    pendingActivationRef.current = false
    startEditing()
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault()
      cancel()
    } else if (event.key === "Enter" && (!multiline || !event.shiftKey)) {
      event.preventDefault()
      commit()
    }
  }

  const displayClassName = [
    "editable-text__display",
    !value && "editable-text__display--empty",
    className,
  ]
    .filter(Boolean)
    .join(" ")
  const inputClassName = ["editable-text__input", className]
    .filter(Boolean)
    .join(" ")

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        className={inputClassName}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
      />
    ) : (
      <input
        ref={inputRef}
        type="text"
        className={inputClassName}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
      />
    )
  }

  return (
    <div
      className={displayClassName}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") startEditing()
      }}
    >
      {value || placeholder}
    </div>
  )
}

export default EditableText
