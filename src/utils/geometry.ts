import type { Position, Rect, ResizeHandle, Size } from '@/types'

/**
 * Pure geometry helpers. Deliberately free of React and of any notion of
 * "notes" so they can be unit-tested and reused by hooks and components alike.
 */

export function clamp(value: number, min: number, max: number): number {
  // A collapsed range (max < min) can happen when bounds are smaller than the
  // minimum size; falling back to `min` keeps the result predictable.
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

export function toRect(position: Position, size: Size): Rect {
  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  }
}

export function clampPositionToBounds(
  position: Position,
  size: Size,
  bounds: Size,
): Position {
  return {
    x: clamp(position.x, 0, bounds.width - size.width),
    y: clamp(position.y, 0, bounds.height - size.height),
  }
}

export function clampRectToBounds(
  rect: Rect,
  bounds: Size,
  minSize: Size,
): Rect {
  const x = clamp(rect.x, 0, bounds.width - minSize.width)
  const y = clamp(rect.y, 0, bounds.height - minSize.height)

  return {
    x,
    y,
    width: clamp(rect.width, minSize.width, bounds.width - x),
    height: clamp(rect.height, minSize.height, bounds.height - y),
  }
}

/**
 * Applies a pointer delta to the rect according to which grip is being pulled.
 * Dragging a north/west grip moves the origin as well as changing the size,
 * and hitting the minimum size pins the opposite edge instead of letting the
 * box drift.
 */
export function resizeRect(
  start: Rect,
  handle: ResizeHandle,
  delta: Position,
  minSize: Size,
): Rect {
  let { x, y, width, height } = start

  if (handle.includes('e')) {
    width = start.width + delta.x
  }
  if (handle.includes('s')) {
    height = start.height + delta.y
  }
  if (handle.includes('w')) {
    width = start.width - delta.x
    x = start.x + delta.x
  }
  if (handle.includes('n')) {
    height = start.height - delta.y
    y = start.y + delta.y
  }

  if (width < minSize.width) {
    if (handle.includes('w')) x = start.x + start.width - minSize.width
    width = minSize.width
  }
  if (height < minSize.height) {
    if (handle.includes('n')) y = start.y + start.height - minSize.height
    height = minSize.height
  }

  return { x, y, width, height }
}

/** Axis-aligned overlap test, used for hit-testing a note against the trash zone. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}
