import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import { AICharacter } from './AICharacter'
import { FrankenAssignment } from '../types/GameState'
import { randomFrom } from 'goodish'
import { GameEvents } from '../types/GameEvents'

declare const IS_DEV: boolean
export class Franken extends AICharacter {

  public controllerState: FrankenAssignment = FrankenAssignment.RESTOCK

  public currentAction: string | null = null
  public isCarrying: boolean = false

  constructor (public scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    if (IS_DEV) {
      this.controllerState = randomFrom([FrankenAssignment.IDLE, FrankenAssignment.RESTOCK, FrankenAssignment.REGISTER])
    }
  }

  makeDecision (): void {
    console.log('franken decision')
    switch (this.controllerState) {
      case FrankenAssignment.RESTOCK:
        this.restock()
        break
      case FrankenAssignment.JANITOR:
        break
      case FrankenAssignment.MANAGER:
        break
      case FrankenAssignment.MANNEQUIN:
        break
      case FrankenAssignment.REGISTER:
        this.register()
        break
      case FrankenAssignment.SECURITY:
        break
      default:
        // IDLE
        console.log('franken idle')
        this.startDecisions()
        const nearbyPoint = this.pathFinder.findNearestClearPoint(this)
        this.moveTo(this.pathFinder.cellPointToPoint(nearbyPoint))
        break
    }
  }

  onPathReset () {
    this.currentAction = null
  }

  onPathComplete () {
    this.makeDecision()
  }

  async register () {
    const AT_REGISTER = 'at register'
    if (!this.currentAction) {
      await this.moveTo(this.scene.staticObjects.cashRegister[1])
      this.currentAction = AT_REGISTER
    }
  }

  async restock () {
    const GETTING_STOCK = 'getting stock'
    const MOVING_STOCK = 'moving stock'
    console.log('restock', this.currentAction)
    if (this.scene.gameState.rearInventory === 0) {
      this.controllerState = FrankenAssignment.IDLE
    }
    switch (this.currentAction) {
      case null:
        let nextPoint = this.pathFinder.findNearestClearPoint(this.pathFinder.pointToCellPoint(randomFrom(this.scene.staticObjects.stockShelves)))
        await this.moveTo(this.pathFinder.cellPointToPoint(nextPoint))
        // this.pauseDecisions()
        this.currentAction = GETTING_STOCK
        break
      case GETTING_STOCK:
        this.isCarrying = true
        nextPoint = this.pathFinder.findNearestClearPoint(this.pathFinder.pointToCellPoint(randomFrom(this.scene.staticObjects.frontShelves)))
        await this.moveTo(this.pathFinder.cellPointToPoint(nextPoint))
        this.currentAction = MOVING_STOCK
        this.scene.events.emit(GameEvents.REDUCE_STOCK, 1)
        break
      case MOVING_STOCK:
        this.isCarrying = false
        this.scene.events.emit(GameEvents.ADD_DISPLAY, 1)
        this.currentAction = null
        this.restock()
        break
    }
  }

}
