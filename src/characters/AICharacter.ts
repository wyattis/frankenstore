import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'

export abstract class AICharacter extends MovableCharacter {

  protected decisionRate = 10 * 1000
  protected isDeciding = true
  protected initialDecision = true

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.decisionLoop()
  }

  pauseDecisions () {
    this.isDeciding = false
  }

  startDecisions () {
    if (!this.isDeciding) {
      this.isDeciding = true
      this.decisionLoop()
    }
  }

  abstract makeDecision (): void

  destroy (fromScene?: boolean) {
    this.isDeciding = false
    super.destroy(fromScene)
  }

  private decisionLoop () {
    this.makeDecision()
    if (this.isDeciding) {
      this.scene.time.delayedCall(this.decisionRate, this.decisionLoop, [], this)
    }
  }


}
