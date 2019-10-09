import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import TimerEvent = Phaser.Time.TimerEvent

declare const IS_DEV: boolean
export abstract class AICharacter extends MovableCharacter {

  protected decisionRate = 10 * 1000
  protected isDeciding = false
  protected loopEvent!: TimerEvent | null
  public deferredDecisionTime = IS_DEV ? 2000 : 5 * 1000
  private deferredEvent!: TimerEvent | null

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.startDecisions()
    if (IS_DEV) {
      this.decisionRate = 2000
    }
  }

  pauseDecisions () {
    this.isDeciding = false
    this.stopDecisions()
    if (this.loopEvent) {
      this.loopEvent.remove()
      this.loopEvent.destroy()
      this.loopEvent = null
    }
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
      this.loopEvent.remove()
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

  stopDecisions () {
    this.isDeciding = false
    if (this.deferredEvent) {
      this.deferredEvent.remove()
      this.deferredEvent.destroy()
      this.deferredEvent = null
    }
  }

  deferredDecision () {
    this.log('deferred decision start')
    if (!this.deferredEvent) {
      this.deferredEvent = this.scene.time.delayedCall(this.deferredDecisionTime, this.startDecisions, [], this)
    }
  }

  abstract makeDecision (): void

  destroy (fromScene?: boolean) {
    this.pauseDecisions()
    super.destroy(fromScene)
  }

  private decisionLoop () {
    if (this.isDeciding) {
      this.makeDecision()
      this.loopEvent = this.scene.time.delayedCall(this.decisionRate, this.decisionLoop, [], this)
    }
  }


}
