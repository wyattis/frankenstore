import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import { CharacterEvent } from '../types/Action'
import { AICharacter } from './AICharacter'
import { randomFrom } from 'goodish'
import { GameEvents } from '../types/GameEvents'
import Mess from '../objects/Mess'

const CHECK_SHELF = 'check shelf'
const CHECK_OUT = 'check out'
const LEAVING = 'leaving'

export class Shopper extends AICharacter {

  public money: number
  public clothes: number = 1
  public bodyParts: number = 5
  public inventory: number = 0
  public purchaseProbability = 0.3
  public leaveProbability = 0.2
  public multiPurchaseProbability = 0.3
  private currentAction: string | null = null

  constructor (public scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.money = randomFrom([20, 30, 40, 50, 60])
    if (charKey === CharKey.SHOPPER1) {
      this.setSize(22, 43)
    } else if (charKey === CharKey.SHOPPER2) {
      this.setSize(19, 46)
    } else {
      this.setSize(22, 37)
    }
    this.setOrigin(.5, 1)
  }

  async makeDecision () {
    this.log('decision', this.charKey, this.currentAction)
    if (!this.currentAction) {
      const clothingRack = randomFrom(this.scene.staticObjects.frontShelves)
      this.pauseDecisions()
      try {
        await this.moveToTile(clothingRack)
        this.once(CharacterEvent.PATH_COMPLETE, () => {
          this.deferredDecision()
        })
      } catch (err) {
        this.log('failed to find a shelf', this.charKey, this.currentAction)
        return this.startDecisions()
      }
      this.currentAction = CHECK_SHELF
    } else if (this.currentAction === CHECK_SHELF) {
      if (this.scene.gameState.frontInventory > 0 && Math.random() < this.purchaseProbability) {
        this.inventory++
        if (Math.random() < this.multiPurchaseProbability) {
          this.currentAction = null
          this.deferredDecision()
        } else {
          this.currentAction = CHECK_OUT
          try {
            this.pauseDecisions()
            await this.moveToTile(randomFrom(this.scene.staticObjects.cashRegister))
            this.once(CharacterEvent.PATH_COMPLETE, () => {
              this.deferredDecision()
            })
          } catch (err) {
            this.log('failed to find the register', this.charKey, this.currentAction)
            return this.startDecisions()
          }
        }
      } else if (Math.random() < this.leaveProbability) {
        this.leave()
      }
    } else if (this.currentAction === CHECK_OUT) {
      const cost = this.inventory * this.scene.gameState.price
      this.scene.events.emit(GameEvents.CASH_REGISTER, { inventory: this.inventory, income: cost })
      this.leave()
    }
    this.log('action', this.currentAction, this.inventory, this.isFollowingPath, this.isDeciding)
  }

  async leave () {
    this.currentAction = LEAVING
    try {
      this.pauseDecisions()
      await this.moveToTile(randomFrom(this.scene.staticObjects.frontDoor))
      this.once(CharacterEvent.PATH_COMPLETE, () => {
        this.destroy(true)
      })
    } catch (err) {
      this.deferredDecision()
    }
  }

  kill () {
    this.log('killing')
    this.scene.events.emit(GameEvents.MURDER, this)
    new Mess(this.scene, this.x, this.y)
    this.currentAction = null
    this.stopDecisions()
    this.destroy(true)
    this.setVisible(false)
    this.setActive(false)
  }

  onPathComplete () {
    this.deferredDecision()
  }

}
