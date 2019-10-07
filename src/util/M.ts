import { Point } from '../types/Geom'

export function distanceBetweenPoints (a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y))
}

export function distanceSquaredBetweenPoints (a: Point, b: Point): number {
  return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
}
