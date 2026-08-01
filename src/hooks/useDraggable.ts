import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Position } from '../types'

export interface UseDraggableOptions {
  /** Element that is moved. Its `left`/`top` must already reflect `position`. */
  targetRef: RefObject<HTMLElement | null>
  position: Position
  /** Fires once per gesture, on pointer release — the only place state is committed. */
  onDragEnd: (position: Position) => void
  onDragStart?: () => void
  /** Fires on every pointer move with the live position (no re-render involved). */
  onDragMove?: (position: Position) => void
  /** Restricts the position, e.g. to keep the element inside its container. */
  constrainPosition?: (position: Position) => Position
  disabled?: boolean
}

export interface UseDraggableResult {
  isDragging: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

interface DragGesture {
  pointerId: number
  origin: Position
  start: Position
  current: Position
}

/**
 * Generic pointer-driven move gesture. Knows nothing about what it moves.
 *
 * While the gesture runs the element is translated by writing `transform`
 * straight to the DOM node, so a drag costs no React renders. The owner is
 * expected to reset `transform` once the committed position has rendered.
 */
export function useDraggable({
  targetRef,
  position,
  onDragEnd,
  onDragStart,
  onDragMove,
  constrainPosition,
  disabled = false,
}: UseDraggableOptions): UseDraggableResult {
  const [isDragging, setIsDragging] = useState(false)
  const gestureRef = useRef<DragGesture | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)

  // Callbacks and position are read through a ref so the listeners attached at
  // pointerdown always see fresh values without being re-created mid-gesture.
  const latestRef = useRef({
    position,
    onDragEnd,
    onDragStart,
    onDragMove,
    constrainPosition,
    disabled,
  })
  useEffect(() => {
    latestRef.current = {
      position,
      onDragEnd,
      onDragStart,
      onDragMove,
      constrainPosition,
      disabled,
    }
  })

  useEffect(() => () => teardownRef.current?.(), [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const element = targetRef.current
      if (!element || latestRef.current.disabled || event.button !== 0) return

      // Stops the browser from starting a text selection or native drag.
      event.preventDefault()

      const start = latestRef.current.position
      const gesture: DragGesture = {
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        start,
        current: start,
      }
      gestureRef.current = gesture

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== gesture.pointerId) return

        const raw: Position = {
          x: gesture.start.x + (moveEvent.clientX - gesture.origin.x),
          y: gesture.start.y + (moveEvent.clientY - gesture.origin.y),
        }
        const next = latestRef.current.constrainPosition?.(raw) ?? raw
        gesture.current = next

        element.style.transform = `translate3d(${next.x - gesture.start.x}px, ${
          next.y - gesture.start.y
        }px, 0)`
        latestRef.current.onDragMove?.(next)
      }

      const handleEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== gesture.pointerId) return
        teardownRef.current?.()
        gestureRef.current = null
        setIsDragging(false)
        latestRef.current.onDragEnd(gesture.current)
      }

      element.setPointerCapture(event.pointerId)
      element.addEventListener('pointermove', handleMove)
      element.addEventListener('pointerup', handleEnd)
      element.addEventListener('pointercancel', handleEnd)

      teardownRef.current = () => {
        element.removeEventListener('pointermove', handleMove)
        element.removeEventListener('pointerup', handleEnd)
        element.removeEventListener('pointercancel', handleEnd)
        if (element.hasPointerCapture(gesture.pointerId)) {
          element.releasePointerCapture(gesture.pointerId)
        }
        teardownRef.current = null
      }

      setIsDragging(true)
      latestRef.current.onDragStart?.()
    },
    [targetRef],
  )

  return { isDragging, onPointerDown }
}
