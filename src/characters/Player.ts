import { Character } from './Character'
import { CharKey } from '../scenes/GameScene'

export enum Direction {
  UP,
  DOWN,
  RIGHT,
  LEFT
}

export class Player extends Character {

  private keys!: {
    W: Phaser.Input.Keyboard.Key,
    A: Phaser.Input.Keyboard.Key,
    S: Phaser.Input.Keyboard.Key,
    D: Phaser.Input.Keyboard.Key,
  }

  constructor (scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, CharKey.PLAYER)
    this.initInput()
  }

  initInput () {
    this.keys = {
      W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
  }

  preUpdate (time: number, delta: number) {
    if (this.keys.W.isDown) {
      this.moveUp()
    } else if (this.keys.S.isDown) {
      this.moveDown()
    } else {
      this.body.setVelocityY(0)
    }
    if (this.keys.D.isDown) {
      this.moveRight()
    } else if (this.keys.A.isDown) {
      this.moveLeft()
    } else {
      this.body.setVelocityX(0)
    }
    super.preUpdate(time, delta)
  }

}
