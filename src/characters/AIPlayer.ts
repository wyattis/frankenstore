import { Character } from './Character'
import PathFinder from '../util/PathFinder'
import GameScene, { CharKey } from '../scenes/GameScene'


export abstract class AIPlayer extends Character {

  private path!: Phaser.Curves.Path | null
  private tweenTarget = { t: 0 }
  protected pathFinder: PathFinder

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.pathFinder = scene.pathFinder
  }

  async moveTo (point: { x: number, y: number }) {
    try {
      const cellPath = await this.pathFinder.findPathPixels({
        x: this.x,
        y: this.y
      }, point)
      this.tweenTarget.t = 0
      this.path = new Phaser.Curves.Path(this.x, this.y)
      for (const cell of cellPath) {
        const pathPoint = this.pathFinder.cellPointToPoint(cell)
        this.path.lineTo(pathPoint.x, pathPoint.y)
      }
      const tweenDuration = cellPath.length * this.walkSpeed / 2
      this.scene.tweens.add({
        targets: this.tweenTarget,
        props: {
          t: { value: 1, duration: tweenDuration }
        },
        onComplete: () => {
          this.path = null
        }
      })
    } catch (err) {
      console.error(err)
    }
  }

  preUpdate () {
    if (this.path) {
      const point = this.path.getPoint(this.tweenTarget.t, this.body.position)
      this.x = point.x
      this.y = point.y
      console.log('path update', this.tweenTarget, this.x, this.y)
    }
  }

}
