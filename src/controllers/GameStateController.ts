import GameScene from '../scenes/GameScene'
import { GameEvents } from '../types/GameEvents'

export class GameStateController {

  private stockPurchaseDelay = 3 * 60 * 1000
  private nStockPurchases = 1

  constructor (private scene: GameScene) {
    scene.time.delayedCall(5 * 1000, this.addShopper, [], this)
    scene.time.delayedCall(3 * 60 * 1000, this.purchaseStock, [], this)
  }

  addShopper () {
    console.log('add shopper')
    this.scene.addShopper()
    let shopperDelay = 20 * 1000 - this.scene.gameState.frontInventory * 600 + this.scene.nShoppers * 200
    if (shopperDelay < 3 * 1000) {
      shopperDelay = 3 * 1000
    }
    this.scene.time.delayedCall(shopperDelay, this.addShopper, [], this)
  }

  purchaseStock () {
    this.scene.events.emit(GameEvents.PURCHASE_INVENTORY, 50 * this.nStockPurchases)
    this.nStockPurchases++
    this.scene.time.delayedCall(this.stockPurchaseDelay, this.purchaseStock, [], this)
  }

}
