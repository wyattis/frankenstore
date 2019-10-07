import { Character } from './Character'
import PathFinder from '../util/PathFinder'
import GameScene from '../scenes/GameScene'
import { PathBins } from '../util/PathBins'
import { CharKey } from '../types/PhaserKeys'


export abstract class MovableCharacter extends Character {

  private path: PathBins = new PathBins()
  protected pathFinder: PathFinder
  public isFollowingPath: boolean = false

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.pathFinder = scene.pathFinder
  }

  onPathComplete () {}

  onPathReset () {}

  async moveTo (point: { x: number, y: number }) {
    const cellPath = await this.pathFinder.findPathPixels({
      x: this.x,
      y: this.y
    }, point)
    this.path.reset()
    for (const cell of cellPath) {
      const pathPoint = this.pathFinder.cellPointToPoint(cell)
      this.path.addPoint(pathPoint)
    }
    console.log(this.constructor.name, 'path', this.path)
    this.isFollowingPath = true
    this.onPathReset()
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
    } else if (this.isFollowingPath) {
      this.isFollowingPath = false
      this.body.setVelocity(0, 0)
      this.onPathComplete()
    }
  }

}
