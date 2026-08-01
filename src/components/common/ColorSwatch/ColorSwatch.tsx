import "./ColorSwatch.css"

export interface ColorSwatchProps {
  colors: readonly string[]
  value: string
  onChange: (color: string) => void
  className?: string
}

/**
 * Generic fixed-palette color picker: a row of swatch buttons, one of which
 * is marked selected. Knows nothing about what the color is applied to.
 *
 * Only the buttons themselves stop pointerdown from propagating, so this can
 * be dropped into a draggable container: picking a color doesn't also drag
 * it, but the row's own padding and gaps remain part of the draggable surface.
 */
function ColorSwatch({ colors, value, onChange, className }: ColorSwatchProps) {
  return (
    <div
      className={["color-swatch", className].filter(Boolean).join(" ")}
      role="radiogroup"
      aria-label="Color"
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={color}
          className="color-swatch__option"
          style={{ backgroundColor: color }}
          data-selected={color === value || undefined}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}

export default ColorSwatch
