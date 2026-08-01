import type { RefObject } from "react"
import "./TrashZone.css"

interface TrashZoneProps {
  zoneRef: RefObject<HTMLDivElement | null>
  isActive: boolean
}

/** Drop target for deleting notes. Measured by the canvas for hit-testing. */
function TrashZone({ zoneRef, isActive }: TrashZoneProps) {
  return (
    <div
      ref={zoneRef}
      className={`trash-zone${isActive ? " trash-zone--active" : ""}`}
      aria-hidden="true"
    >
      <svg className="trash-zone__icon" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7h10ZM10 11v6M14 11v6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="trash-zone__label">Drop here to delete</span>
    </div>
  )
}

export default TrashZone
