import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import TimerEvent = Phaser.Time.TimerEvent

export abstract class AICharacter extends MovableCharacter {

  protected decisionRate = 10 * 1000
  protected isDeciding = true
  protected initialDecision = true
  protected loopEvent!: TimerEvent | null

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

  lock () {
    this.isLocked = true
    this.anims.stop()
    if (this.loopEvent) {
      this.loopEvent.destroy()
      this.loopEvent = null
    }
  }

  unlock () {
    this.isLocked = false
    if (this.isDeciding) {
      this.decisionLoop()
    }
  }

  abstract makeDecision (): void

  destroy (fromScene?: boolean) {
    this.isDeciding = false
    if (this.loopEvent) {
      this.loopEvent.destroy()
      this.loopEvent = null
    }
    super.destroy(fromScene)
  }

  private decisionLoop () {
    this.makeDecision()
    if (this.isDeciding) {
      this.loopEvent = this.scene.time.delayedCall(this.decisionRate, this.decisionLoop, [], this)
    }
  }


}
