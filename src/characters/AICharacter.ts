import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'

export abstract class AICharacter extends MovableCharacter {

  protected decisionRate = 10 * 1000
  protected isRunning = true
  protected initialDecision = true

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.decisionLoop()
  }

  pauseDecisions () {
    this.isRunning = false
  }

  startDecisions () {
    if (!this.isRunning) {
      this.isRunning = true
      this.decisionLoop()
    }
  }

  abstract makeDecision (): void

  private decisionLoop () {
    this.makeDecision()
    if (this.isRunning) {
      this.scene.time.delayedCall(this.decisionRate, this.decisionLoop, [], this)
    }
  }


}
