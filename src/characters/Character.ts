import { Direction } from './Player'
import { CharacterStateAnimMap } from '../types/CharacterStateAnimMap'
import Vector2 = Phaser.Math.Vector2
import { AnimStates, CharKey } from '../scenes/GameScene'

export class Character extends Phaser.GameObjects.Sprite {

  protected facing: Direction = Direction.DOWN
  private prevFacing: Direction = Direction.UP
  private prevVel: Vector2 = new Vector2(0, 1)
  private animMap!: CharacterStateAnimMap

  public body!: Phaser.Physics.Arcade.Body
  public walkSpeed: number = 200

  constructor (scene: Phaser.Scene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture)
    this.makeAnimMap(charKey)
    this.scene.physics.add.existing(this)
  }

  private makeAnimMap (key: string) {
    this.animMap = {
      up: `${key}-${AnimStates.UP}`,
      upWalk: `${key}-${AnimStates.UP_WALK}`,
      down: `${key}-${AnimStates.DOWN}`,
      downWalk: `${key}-${AnimStates.DOWN_WALK}`,
      left: `${key}-${AnimStates.LEFT}`,
      leftWalk: `${key}-${AnimStates.LEFT_WALK}`,
      right: `${key}-${AnimStates.RIGHT}`,
      rightWalk: `${key}-${AnimStates.RIGHT_WALK}`
    }
  }
  protected preUpdate (time: number, delta: number): void {
    super.preUpdate(time, delta)
    const dirChanged = this.facing !== this.prevFacing
    const velChanged = this.prevVel.x !== this.body.velocity.x || this.prevVel.y !== this.body.velocity.y

    if (this.body.velocity.y > 0 && dirChanged) {
      this.anims.play(this.animMap.downWalk)
    } else if (this.body.velocity.y < 0 && dirChanged) {
      this.anims.play(this.animMap.upWalk)
    } else if (this.body.velocity.x > 0 && dirChanged) {
      this.anims.play(this.animMap.rightWalk)
    } else if (this.body.velocity.x < 0 && dirChanged) {
      this.anims.play(this.animMap.leftWalk)
    } else if (this.facing === Direction.DOWN && velChanged) {
      this.anims.play(this.animMap.down)
    } else if (this.facing === Direction.UP && velChanged) {
      this.anims.play(this.animMap.up)
    } else if (this.facing === Direction.RIGHT && velChanged) {
      this.anims.play(this.animMap.right)
    } else if (this.facing === Direction.LEFT && velChanged) {
      this.anims.play(this.animMap.left)
    }

    this.prevVel.x = this.body.velocity.x
    this.prevVel.y = this.body.velocity.y
    this.prevFacing = this.facing
  }

  moveRight () {
    this.facing = Direction.RIGHT
    this.body.setVelocityX(this.walkSpeed)
  }

  moveLeft () {
    this.facing = Direction.LEFT
    this.body.setVelocityX(-this.walkSpeed)
  }

  moveDown () {
    this.facing = Direction.DOWN
    this.body.setVelocityY(this.walkSpeed)
  }

  moveUp () {
    this.facing = Direction.UP
    this.body.setVelocityY(-this.walkSpeed)
  }

}
