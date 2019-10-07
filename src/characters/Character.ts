import { Direction } from './Player'
import { CharacterStateAnimMap } from '../types/CharacterStateAnimMap'
import { AnimStates, CharKey } from '../types/PhaserKeys'
import GameScene from '../scenes/GameScene'

export abstract class Character extends Phaser.GameObjects.Sprite {

  protected facing: Direction = Direction.DOWN
  private animMap!: CharacterStateAnimMap

  public body!: Phaser.Physics.Arcade.Body
  public walkSpeed: number = 100

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.makeAnimMap(charKey)
    this.anims.play(this.animMap.down)
    this.scene.physics.add.existing(this)
    this.setOrigin(0, 1)
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

  preUpdate (time: number, delta: number): void {
    super.preUpdate(time, delta)
    /**
     * TODO: A minimal performance improvement could come from tracking animation state with an int based enum instead
     * of doing the string comparison
     */
    if (this.body.velocity.y > 0 && this.anims.currentAnim.key !== this.animMap.downWalk) {
      this.anims.play(this.animMap.downWalk)
    } else if (this.body.velocity.y < 0 && this.anims.currentAnim.key !== this.animMap.upWalk) {
      this.anims.play(this.animMap.upWalk)
    } else if (this.body.velocity.x > 0 && this.anims.currentAnim.key !== this.animMap.rightWalk) {
      this.anims.play(this.animMap.rightWalk)
    } else if (this.body.velocity.x < 0 && this.anims.currentAnim.key !== this.animMap.leftWalk) {
      this.anims.play(this.animMap.leftWalk)
    } else if (this.body.velocity.y === 0 && this.body.velocity.x === 0) {
      if (this.facing === Direction.DOWN && this.anims.currentAnim.key !== this.animMap.down) {
        this.anims.play(this.animMap.down)
      } else if (this.facing === Direction.UP && this.anims.currentAnim.key !== this.animMap.up) {
        this.anims.play(this.animMap.up)
      } else if (this.facing === Direction.RIGHT && this.anims.currentAnim.key !== this.animMap.right) {
        this.anims.play(this.animMap.right)
      } else if (this.facing === Direction.LEFT && this.anims.currentAnim.key !== this.animMap.left) {
        this.anims.play(this.animMap.left)
      }
    }

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


