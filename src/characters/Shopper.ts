import { AIPlayer } from './AIPlayer'
import { randomInt } from 'goodish'
import GameScene, { CharKey } from '../scenes/GameScene'

export class Shopper extends AIPlayer {

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {

    super(scene, x, y, texture, charKey)

    scene.time.delayedCall(2000, () => {
      this.moveTo({
        x: randomInt(0, 30) * scene.map.tileWidth,
        y: randomInt(0, 30) * scene.map.tileHeight
      })
    }, [], null)

  }

}
