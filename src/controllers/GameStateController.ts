import GameScene from '../scenes/GameScene'

export class GameStateController {

  private shopperDelay = 30 * 1000

  constructor (private scene: GameScene) {
    scene.time.delayedCall(1 * 1000, this.addShopper, [], this)
  }

  addShopper () {
    this.scene.addShopper()
    this.shopperDelay -= (this.shopperDelay / 30000) * 1000
    this.scene.time.delayedCall(this.shopperDelay, this.addShopper, [], this)
  }

}
