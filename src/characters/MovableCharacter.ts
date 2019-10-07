import { Character } from './Character'
import PathFinder from '../util/PathFinder'
import GameScene from '../scenes/GameScene'
import { PathBins } from '../util/PathBins'
import { CharKey } from '../types/PhaserKeys'


export abstract class MovableCharacter extends Character {

  private path: PathBins = new PathBins()
  protected pathFinder: PathFinder


  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.pathFinder = scene.pathFinder
  }

  async moveTo (point: { x: number, y: number }) {
    console.log('moving from', this.x, this.y, 'to', point.x, point.y)
    try {
      const cellPath = await this.pathFinder.findPathPixels({
        x: this.x,
        y: this.y
      }, point)
      this.path.reset()
      for (const cell of cellPath) {
        const pathPoint = this.pathFinder.cellPointToPoint(cell)
        this.path.addPoint(pathPoint)
      }
      console.log('path', this.path)
    } catch (err) {
      console.error(err)
    }
  }

  async moveToTile (point: { x: number, y: number }) {
    console.log('moving from', this.x, this.y, 'to', point.x, point.y)
    try {
      const cellPath = await this.pathFinder.findPath(this.pathFinder.pointToCell({
        x: this.x,
        y: this.y
      }), {
        row: point.x,
        col: point.y
      })
      this.path.reset()
      for (const cell of cellPath) {
        const pathPoint = this.pathFinder.cellPointToPoint(cell)
        this.path.addPoint(pathPoint)
      }
      console.log('path', this.path)
    } catch (err) {
      console.error(err)
    }
  }

  preUpdate (time: number, delta: number) {
    super.preUpdate(time, delta)
    if (!this.path.isDone) {
      const v = this.path.getNextDirection(this)
      if (v) {
        if (v.x > 0) {
          this.moveRight()
        } else if (v.x < 0) {
          this.moveLeft()
        } else {
          this.body.setVelocityX(0)
        }
        if (v.y > 0) {
          this.moveDown()
        } else if (v.y < 0) {
          this.moveUp()
        } else {
          this.body.setVelocityY(0)
        }
      }
    } else {
      this.body.setVelocity(0)
    }
  }

}
