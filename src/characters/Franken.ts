import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import { AICharacter } from './AICharacter'
import { FrankenAssignment } from '../types/GameState'
import { randomFrom, randomInt } from 'goodish'
import { GameEvents } from '../types/GameEvents'
import { CharacterEvent } from '../types/Action'
import { InteractiveTile } from '../types/InteractiveTile'

declare const IS_DEV: boolean
export class Franken extends AICharacter {

  public controllerState: FrankenAssignment = FrankenAssignment.RESTOCK

  public currentAction: string | null = null
  public isCarrying: boolean = false
  public strength: number
  public inventory: number = 0

  constructor (public scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.strength = randomInt(1, 4)
    // if (IS_DEV) {
    //   this.controllerState = randomFrom([FrankenAssignment.IDLE, FrankenAssignment.RESTOCK, FrankenAssignment.REGISTER])
    // }
    this.setSize(16, 38)
  }

  makeDecision (): void {
    this.log('decision', this.controllerState)
    switch (this.controllerState) {
      case FrankenAssignment.RESTOCK:
        this.restock()
        break
      case FrankenAssignment.REGISTER:
        this.register()
        break
      default:
        // IDLE
        this.log('idle')
        this.startDecisions()
        // const nearbyPoint = this.pathFinder.findNearestClearPoint(this)
        // this.moveTo(this.pathFinder.cellPointToPoint(nearbyPoint))
        break
    }
  }

  async register () {
    const AT_REGISTER = 'at register'
    if (!this.currentAction) {
      this.pauseDecisions()
      await this.moveToTile(this.scene.staticObjects.cashRegister[1])
      this.once(CharacterEvent.PATH_COMPLETE, () => {
        this.deferredDecision()
      })
      this.currentAction = AT_REGISTER
    } else if (this.scene.gameState.rearInventory > 0) {
      this.currentAction = null
      this.controllerState = FrankenAssignment.RESTOCK
    }
  }

  moveToTile (tile: InteractiveTile) {
    return super.moveToTile(tile)
  }

  async restock () {
    const GETTING_STOCK = 'getting stock'
    const MOVING_STOCK = 'moving stock'
    this.log('restock', this.currentAction)
    if (this.scene.gameState.rearInventory <= 0) {
      this.controllerState = FrankenAssignment.REGISTER
    } else {
      this.controllerState = FrankenAssignment.RESTOCK
    }
    switch (this.currentAction) {
      case null:
        try {
          let nextTile = randomFrom(this.scene.staticObjects.stockShelves)
          this.pauseDecisions()
          await this.moveToTile(nextTile)
          this.once(CharacterEvent.PATH_COMPLETE, () => {
            if (this.scene.gameState.rearInventory <= 0) {
              return this.deferredDecision()
            }
            this.inventory += this.scene.gameState.rearInventory >= this.strength ? this.strength : this.scene.gameState.rearInventory
            this.scene.events.emit(GameEvents.REDUCE_STOCK, this.inventory)
            this.isCarrying = true
            this.deferredDecision()
          })
        } catch (err) {
          this.log('failed to move to tile')
          return this.startDecisions()
        }
        this.currentAction = GETTING_STOCK
        break
      case GETTING_STOCK:
        const frontShelf = randomFrom(this.scene.staticObjects.frontShelves)
        try {
          this.pauseDecisions()
          await this.moveToTile(frontShelf)
          this.once(CharacterEvent.PATH_COMPLETE, () => {
            this.scene.events.emit(GameEvents.ADD_DISPLAY, this.inventory)
            this.inventory = 0
            this.isCarrying = false
            this.currentAction = null
            return this.deferredDecision()
          })
        } catch (err) {
          this.log('failed to move to a front shelf')
          return this.startDecisions()
        }
        this.currentAction = MOVING_STOCK
        break
      default:
        this.log('should not get here')

    }
  }

}
