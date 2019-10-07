import GameScene from '../scenes/GameScene'
import { CharKey, TileTypes } from '../types/PhaserKeys'
import { Action } from '../types/Action'
import { ActionableCharacter } from './ActionableCharacter'
import { AICharacter } from './AICharacter'
import { randomFrom, randomInt } from 'goodish'
import { GameEvents } from '../types/GameEvents'
import TimerEvent = Phaser.Time.TimerEvent
import Mess from '../objects/Mess'

const CHECK_SHELF = 'check shelf'
const CHECK_OUT = 'check out'
const LEAVING = 'leaving'

export class Shopper extends AICharacter {

  public isSelectable = false
  public money: number
  public clothes: number = 1
  public bodyParts: number = 5
  public inventory: number = 0
  public purchaseProbability = 0.3
  public leaveProbability = 0.3
  public multiPurchaseProbability = 0.3
  public deferredDecisionTime = 5 * 1000
  private deferredEvent!: TimerEvent | null
  private currentAction: string | null = null

  constructor (public scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.money = randomInt(5, 1000)
  }

  async makeDecision () {
    if (this.scene.shoppers.length >= 10) return
    if (!this.currentAction) {
      const clothingRack = randomFrom(this.scene.staticObjects.frontShelves)
      this.currentAction = CHECK_SHELF
      this.pauseDecisions()
      try {
        await this.moveToTile(clothingRack)
      } catch (err) {
        this.currentAction = null
        this.deferredDecision()
      }
    } else if (this.currentAction === CHECK_SHELF) {
      if (Math.random() < this.purchaseProbability) {
        this.inventory++
        if (Math.random() < this.multiPurchaseProbability) {
          this.currentAction = null
          this.deferredDecision()
        } else {
          this.currentAction = CHECK_OUT
          try {
            await this.moveToTile(randomFrom(this.scene.staticObjects.cashRegister))
          } catch (err) {
            this.deferredDecision()
          }
        }
      } else if (Math.random() < this.leaveProbability) {
        this.leave()
      } else {
        this.deferredDecision()
      }
    } else if (this.currentAction === CHECK_OUT) {
      const cost = this.inventory * this.scene.gameState.price
      this.scene.events.emit(GameEvents.CASH_REGISTER, { inventory: this.inventory, income: cost })
      this.leave()
    } else if (this.currentAction === LEAVING) {
      this.scene.events.emit(GameEvents.CUSTOMER_LEAVE, this)
      this.destroy(true)
    }
    console.log('shopper action', this.currentAction, this.inventory, this.isFollowingPath, this.isDeciding)
  }

  async leave () {
    this.currentAction = LEAVING
    try {
      await this.moveToTile(randomFrom(this.scene.staticObjects.frontDoor))
    } catch (err) {
      this.deferredDecision()
    }
  }

  kill () {
    console.log('kill shopper')
    new Mess(this.scene, this.x, this.y)
    this.currentAction = null
    this.stopDecisions()
    this.destroy(true)
    this.setVisible(false)
    this.setActive(false)
  }

  stopDecisions () {
    this.isDeciding = false
    if (this.deferredEvent) {
      this.deferredEvent.destroy()
      this.deferredEvent = null
    }
  }

  deferredDecision () {
    if (!this.deferredEvent) {
      this.deferredEvent = this.scene.time.delayedCall(this.deferredDecisionTime, this.makeDecision, [], this)
    }
  }

  onPathComplete () {
    this.deferredDecision()
  }

  showMenuFor (char: ActionableCharacter) {
    const options = [{
      label: 'Kill',
      action: () => char.act(Action.KILL, this)
    }]
  }

}
