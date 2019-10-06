import { AIPlayer } from './AIPlayer'
import PathFinder from '../util/PathFinder'
import { randomInt } from 'goodish'
import { CharKey } from '../scenes/GameScene'

export class Shopper extends AIPlayer {

  constructor (scene: Phaser.Scene, x: number, y: number, texture: string, charKey: CharKey, pathFinder: PathFinder) {

    super(scene, x, y, texture, charKey, pathFinder)

    scene.time.delayedCall(2000, () => {
      this.moveTo({
        x: randomInt(0, 300),
        y: randomInt(0, 300)
      })
    }, [], null)

  }

}
