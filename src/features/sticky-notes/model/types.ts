import type { Rect } from '@/types'

export interface Note extends Rect {
  id: string
  color: string
  text: string
  zIndex: number
}
