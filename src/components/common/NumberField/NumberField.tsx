import { useId } from 'react'
import './NumberField.css'

export interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

/** Generic labelled numeric input. */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: NumberFieldProps) {
  const id = useId()

  return (
    <div className="number-field">
      <label className="number-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="number-field__input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value)
          // An empty or half-typed input parses to NaN; ignore it and keep the
          // last valid value rather than pushing NaN into state.
          if (Number.isFinite(next)) onChange(next)
        }}
      />
    </div>
  )
}

export default NumberField
