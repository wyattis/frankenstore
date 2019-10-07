import GameScene from '../scenes/GameScene'
import { GameEvents } from '../types/GameEvents'

export class GameStateController {

  private shopperDelay = 30 * 1000
  private stockPurchaseDelay = 2 * 60 * 1000
  private nStockPurchases = 1

  constructor (private scene: GameScene) {
    scene.time.delayedCall(1 * 1000, this.addShopper, [], this)
    scene.time.delayedCall(30 * 1000, this.purchaseStock, [], this)
  }

  addShopper () {
    this.scene.addShopper()
    this.shopperDelay -= (this.shopperDelay / 30000) * 1000
    if (this.shopperDelay < 5 * 1000) {
      this.shopperDelay = 5 * 1000
    }
    this.scene.time.delayedCall(this.shopperDelay, this.addShopper, [], this)
  }

  purchaseStock () {
    this.scene.events.emit(GameEvents.PURCHASE_INVENTORY, 100 * this.nStockPurchases)
    this.nStockPurchases++
    this.scene.time.delayedCall(this.stockPurchaseDelay, this.purchaseStock, [], this)
  }

}
