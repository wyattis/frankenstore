import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'

export abstract class AICharacter extends MovableCharacter {

  protected decisionRate = 10 * 1000
  protected initialDecision = true

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    if (this.initialDecision) {
      this.decisionLoop()
    }
  }

  abstract makeDecision (): void

  private decisionLoop () {
    this.makeDecision()
    this.scene.time.delayedCall(this.decisionRate, this.decisionLoop, [], this)
  }


}
