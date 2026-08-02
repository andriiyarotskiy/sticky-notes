import { useId, useState } from "react"
import type { KeyboardEvent } from "react"
import "./NumberField.css"

export interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

/**
 * Generic labelled numeric input. Keeps its own draft text while the user is
 * typing — an empty or half-typed value (e.g. "-", "") is not a number and
 * must not be coerced into one — and only commits a clamped, finite value to
 * `onChange` on blur or Enter. An invalid draft reverts to the last committed
 * value, the same commit/cancel shape `EditableText` uses.
 */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))

  // Resets the draft when `value` changes for reasons other than this field's
  // own commit (e.g. the caller clamping it elsewhere) — adjusted during
  // render, per React's guidance, rather than in an effect, so the stale
  // draft never has a chance to paint first.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(String(value))
  }

  const commit = () => {
    const parsed = Number(draft)
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }

    let clamped = parsed
    if (min !== undefined) clamped = Math.max(clamped, min)
    if (max !== undefined) clamped = Math.min(clamped, max)

    setDraft(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur()
  }

  return (
    <div className="number-field">
      <label className="number-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="number-field__input"
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default NumberField
