import { Character } from './Character'
import PathFinder, { Point } from '../util/PathFinder'
import { CharKey } from '../scenes/GameScene'


export abstract class AIPlayer extends Character {

  private path!: Phaser.Curves.Path | null
  private tweenTarget = { t: 0 }

  constructor (scene: Phaser.Scene, x: number, y: number, texture: string, charKey: CharKey, protected pathFinder: PathFinder) {
    super(scene, x, y, texture, charKey)
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
      const tweenDuration = cellPath.length * this.walkSpeed
      this.scene.tweens.add({
        targets: this.tweenTarget,
        props: {
          t: { value: 1, duration: tweenDuration }
        },
        onStart: () => {console.log('tween start')},
        onComplete: () => {
          console.log('tween complete')
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
