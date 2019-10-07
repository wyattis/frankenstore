import { Point } from '../types/Geom'
import Vector2 = Phaser.Math.Vector2

export class PathBins {

  private index: number = 0

  constructor (private tolerance = 2, private path: Point[] = []) {}

  getNextDirection (pos: Point): Point | null {
    if (this.index >= this.path.length) {
      return null
    }
    const nextPoint = this.path[this.index]
    let dx = nextPoint.x - pos.x
    let dy = nextPoint.y - pos.y
    if (Math.abs(dx) < this.tolerance) {
      dx = 0
    }
    if (Math.abs(dy) < this.tolerance) {
      dy = 0
    }
    if (dx === 0 && dy === 0) {
      this.index++
      return this.getNextDirection(pos)
    } else {
      return {
        x: dx,
        y: dy
      }
    }
  }

  reset () {
    this.path = []
    this.index = 0
  }

  getPointAtTime (t: number): Point {
    const index = Math.round(t * (this.path.length - 1))
    return this.path[index]
  }

  addPoint (point: Point) {
    this.path.push(point)
  }

  get isDone (): boolean {
    return this.index >= this.path.length
  }

}
