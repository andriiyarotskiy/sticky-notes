import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import {
  clampPositionToBounds,
  clampRectToBounds,
  toRect,
} from '../../utils/geometry'
import type { Position, Rect, ResizeHandle, Size } from '../../types'
import './DraggableBox.css'

const ALL_HANDLES: readonly ResizeHandle[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
]

const DEFAULT_MIN_SIZE: Size = { width: 80, height: 60 }

export interface DraggableBoxProps {
  position: Position
  size: Size
  minSize?: Size
  /** Container the box is kept inside. Omit to allow free movement. */
  bounds?: Size
  zIndex?: number
  className?: string
  children?: ReactNode
  resizeHandles?: readonly ResizeHandle[]
  disabled?: boolean
  /** Fires on pointer down, before any gesture — useful for focus/stacking. */
  onActivate?: () => void
  onDragStart?: () => void
  onDragMove?: (position: Position) => void
  onDragEnd?: (position: Position) => void
  onResizeStart?: () => void
  onResizeMove?: (rect: Rect) => void
  onResizeEnd?: (rect: Rect) => void
}

/**
 * Content-agnostic box that can be moved and resized by pointer. It owns the
 * element's geometry in the DOM: gestures write to the node directly (see the
 * hooks), and this component re-applies the committed props once a gesture
 * ends. Keeping a single owner avoids React and the gestures fighting over the
 * same style properties.
 */
function DraggableBox({
  position,
  size,
  minSize = DEFAULT_MIN_SIZE,
  bounds,
  zIndex,
  className,
  children,
  resizeHandles = ALL_HANDLES,
  disabled = false,
  onActivate,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: DraggableBoxProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  const rect = useMemo(() => toRect(position, size), [position, size])

  const constrainPosition = useCallback(
    (next: Position) =>
      bounds ? clampPositionToBounds(next, size, bounds) : next,
    [bounds, size],
  )

  const constrainRect = useCallback(
    (next: Rect) => (bounds ? clampRectToBounds(next, bounds, minSize) : next),
    [bounds, minSize],
  )

  const handleDragEnd = useCallback(
    (next: Position) => onDragEnd?.(next),
    [onDragEnd],
  )

  const handleResizeEnd = useCallback(
    (next: Rect) => onResizeEnd?.(next),
    [onResizeEnd],
  )

  const { isDragging, onPointerDown } = useDraggable({
    targetRef: elementRef,
    position,
    onDragStart,
    onDragMove,
    onDragEnd: handleDragEnd,
    constrainPosition,
    disabled,
  })

  const { isResizing, getHandleProps } = useResizable({
    targetRef: elementRef,
    rect,
    minSize,
    onResizeStart,
    onResizeMove,
    onResizeEnd: handleResizeEnd,
    constrainRect,
    disabled,
  })

  const isInteracting = isDragging || isResizing

  // Runs on mount, whenever the committed geometry changes, and whenever a
  // gesture finishes — the last case matters because a gesture may end on the
  // same values it started from, which React alone would not repaint.
  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element || isInteracting) return

    element.style.transform = ''
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`
    element.style.width = `${size.width}px`
    element.style.height = `${size.height}px`
  }, [position.x, position.y, size.width, size.height, isInteracting])

  const classNames = ['draggable-box']
  if (isDragging) classNames.push('draggable-box--dragging')
  if (isResizing) classNames.push('draggable-box--resizing')
  if (className) classNames.push(className)

  return (
    <div
      ref={elementRef}
      className={classNames.join(' ')}
      style={{ zIndex }}
      onPointerDownCapture={onActivate}
      onPointerDown={onPointerDown}
    >
      {children}
      {!disabled &&
        resizeHandles.map((handle) => (
          <span
            key={handle}
            className={`draggable-box__handle draggable-box__handle--${handle}`}
            {...getHandleProps(handle)}
          />
        ))}
    </div>
  )
}

export default DraggableBox
