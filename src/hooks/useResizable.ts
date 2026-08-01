import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Position, Rect, ResizeHandle, Size } from '../types'
import { resizeRect } from '../utils/geometry'

export interface UseResizableOptions {
  /** Element that is resized. Its box must already reflect `rect`. */
  targetRef: RefObject<HTMLElement | null>
  rect: Rect
  minSize: Size
  /** Fires once per gesture, on pointer release — the only place state is committed. */
  onResizeEnd: (rect: Rect) => void
  onResizeStart?: () => void
  /** Fires on every pointer move with the live rect (no re-render involved). */
  onResizeMove?: (rect: Rect) => void
  /** Restricts the rect, e.g. to keep the element inside its container. */
  constrainRect?: (rect: Rect) => Rect
  disabled?: boolean
}

export interface ResizeHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

export interface UseResizableResult {
  isResizing: boolean
  getHandleProps: (handle: ResizeHandle) => ResizeHandleProps
}

interface ResizeGesture {
  pointerId: number
  origin: Position
  start: Rect
  current: Rect
}

/**
 * Generic pointer-driven resize gesture. Knows nothing about what it resizes.
 *
 * Size cannot be expressed as a transform, so the live rect is written to the
 * element's box properties directly; the owner restores React-controlled
 * styles once the committed rect has rendered.
 */
export function useResizable({
  targetRef,
  rect,
  minSize,
  onResizeEnd,
  onResizeStart,
  onResizeMove,
  constrainRect,
  disabled = false,
}: UseResizableOptions): UseResizableResult {
  const [isResizing, setIsResizing] = useState(false)
  const teardownRef = useRef<(() => void) | null>(null)

  const latestRef = useRef({
    rect,
    minSize,
    onResizeEnd,
    onResizeStart,
    onResizeMove,
    constrainRect,
    disabled,
  })
  useEffect(() => {
    latestRef.current = {
      rect,
      minSize,
      onResizeEnd,
      onResizeStart,
      onResizeMove,
      constrainRect,
      disabled,
    }
  })

  useEffect(() => () => teardownRef.current?.(), [])

  const startGesture = useCallback(
    (handle: ResizeHandle, event: ReactPointerEvent<HTMLElement>) => {
      const element = targetRef.current
      if (!element || latestRef.current.disabled || event.button !== 0) return

      // Keeps the grip from also triggering a move gesture on the parent box.
      event.stopPropagation()
      event.preventDefault()

      const start = latestRef.current.rect
      const gesture: ResizeGesture = {
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        start,
        current: start,
      }

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== gesture.pointerId) return

        const delta: Position = {
          x: moveEvent.clientX - gesture.origin.x,
          y: moveEvent.clientY - gesture.origin.y,
        }
        const resized = resizeRect(
          gesture.start,
          handle,
          delta,
          latestRef.current.minSize,
        )
        const next = latestRef.current.constrainRect?.(resized) ?? resized
        gesture.current = next

        element.style.left = `${next.x}px`
        element.style.top = `${next.y}px`
        element.style.width = `${next.width}px`
        element.style.height = `${next.height}px`
        latestRef.current.onResizeMove?.(next)
      }

      const handleEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== gesture.pointerId) return
        teardownRef.current?.()
        setIsResizing(false)
        latestRef.current.onResizeEnd(gesture.current)
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

      setIsResizing(true)
      latestRef.current.onResizeStart?.()
    },
    [targetRef],
  )

  const getHandleProps = useCallback(
    (handle: ResizeHandle): ResizeHandleProps => ({
      onPointerDown: (event) => startGesture(handle, event),
    }),
    [startGesture],
  )

  return { isResizing, getHandleProps }
}
