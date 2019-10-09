import { Point } from '../types/Geom'
import Vector2 = Phaser.Math.Vector2

export class PathBins {

  private index: number = 0

  constructor (private tolerance = 2, private path: Point[] = []) {}

  getNextDirection (pos: Point): Vector2 | null {
    if (this.index >= this.path.length) {
      return null
    }
    const nextPoint = this.path[this.index]
    let dx = nextPoint.x - pos.x
    let dy = nextPoint.y - pos.y
    const v = new Vector2(dx, dy)
    if (Math.abs(dx) < this.tolerance) {
      v.x = 0
    }
    if (Math.abs(dy) < this.tolerance) {
      v.y = 0
    }
    if (v.x === 0 && v.y === 0) {
      this.index++
      return this.getNextDirection(pos)
    } else {
      return v.normalize()
    }
  }

  getPoint (): Point | null {
    return this.path[this.index]
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
