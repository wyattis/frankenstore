import GameScene from '../scenes/GameScene'
import { SpriteSheet } from '../types/PhaserKeys'
import { GameEvents } from '../types/GameEvents'
import { randomInt } from 'goodish'

export default class Mess extends Phaser.GameObjects.Container {

  private bodyParts: Phaser.GameObjects.Image
  private blood: Phaser.GameObjects.Image

  constructor (public scene: GameScene, x: number, y: number) {
    super(scene, x, y)
    this.blood = scene.add.image(x, y, SpriteSheet.MESS, 0)
    this.bodyParts = scene.add.image(x, y, SpriteSheet.MESS, 1)
    this.setSize(20, 20)
    this.scene.mainInputController.enableObject(this)
    this.depth = 0
  }

  retrieveBodyParts () {
    this.scene.tweens.add({
      targets: this.bodyParts,
      alpha: { value: 0, duration: 2000 },
      duration: 1000,
      onComplete: () => {
        this.bodyParts.destroy(true)
        this.scene.events.emit(GameEvents.RETRIEVE_PARTS, randomInt(2, 5))
      }
    })
  }

  destroy () {
    this.bodyParts.destroy(true)
    this.blood.destroy(true)
    super.destroy(true)
  }

  clean () {
    this.scene.tweens.add({
      targets: this.blood,
      alpha: { value: 0, duration: 2000 },
      duration: 1000,
      onComplete: () => {
        this.destroy()
      }
    })
  }

  interact () {
    if (this.bodyParts.visible) {
      this.retrieveBodyParts()
    } else {
      this.clean()
    }
  }

}
