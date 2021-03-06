import { Character } from './Character'
import PathFinder from '../util/PathFinder'
import GameScene from '../scenes/GameScene'
import { PathBins } from '../util/PathBins'
import { CharKey } from '../types/PhaserKeys'
import { InteractiveTile } from '../types/InteractiveTile'
import { CharacterEvent } from '../types/Action'


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
    this.isFollowingPath = true
    this.onPathReset()
    this.emit(CharacterEvent.PATH_RESET)
  }

  async moveToTile (tile: InteractiveTile) {
    const cellPath = await this.pathFinder.findPathPixels({
      x: this.x,
      y: this.y
    }, this.pathFinder.cellPointToPoint({
      x: tile.charX,
      y: tile.charY
    }))
    this.path.reset()
    for (let i = 2; i < cellPath.length; i++) {
      const cell = cellPath[i]
      const pathPoint = this.pathFinder.cellPointToPoint(cell)
      pathPoint.x += this.pathFinder.tileWidth / 2
      pathPoint.y += this.pathFinder.tileHeight / 2
      this.path.addPoint(pathPoint)
    }
    this.isFollowingPath = true
    this.onPathReset()
  }

  preUpdate (time: number, delta: number) {
    super.preUpdate(time, delta)
    if (this.isLocked) return
    if (!this.path.isDone) {
      const v = this.path.getNextDirection(this)
      const p = this.path.getPoint()
      if (v && p) {
        if (v.x > 0) {
          this.moveRight(Math.abs(v.x))
        } else if (v.x < 0) {
          this.moveLeft(Math.abs(v.x))
        } else {
          this.x = p.x
          this.body.setVelocityX(0)
        }
        if (v.y > 0) {
          this.moveDown(Math.abs(v.y))
        } else if (v.y < 0) {
          this.moveUp(Math.abs(v.y))
        } else {
          this.y = p.y
          this.body.setVelocityY(0)
        }
      }
    } else if (this.isFollowingPath) {
      this.isFollowingPath = false
      this.body.setVelocity(0, 0)
      this.onPathComplete()
      this.emit(CharacterEvent.PATH_COMPLETE)
    }
  }

}
