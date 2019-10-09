import { Direction } from './Player'
import { CharacterStateAnimMap } from '../types/CharacterStateAnimMap'
import { AnimStates, CharKey } from '../types/PhaserKeys'
import GameScene from '../scenes/GameScene'

declare const IS_DEV: boolean
export abstract class Character extends Phaser.GameObjects.Sprite {

  protected facing: Direction = Direction.DOWN
  private animMap!: CharacterStateAnimMap

  public body!: Phaser.Physics.Arcade.Body
  public walkSpeed: number = 100
  private tileHeight: number
  public isLocked: boolean = false
  public blockStateChange: boolean = false

  constructor (public scene: GameScene, x: number, y: number, texture: string, public charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.makeAnimMap(charKey)
    this.anims.play(this.animMap.down)
    this.setDepth(2)
    this.setOrigin(0.2, 1)
    this.tileHeight = scene.map.tileHeight
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

  log (...args: any[]) {
    console.log(`${this.constructor.name}:`, ...args)
  }

  preUpdate (time: number, delta: number): void {
    super.preUpdate(time, delta)
    // if (this.isLocked) return
    this.setDepth(this.scene.pathFinder.pixelsToTile(this.y + 8, this.tileHeight))

    /**
     * TODO: A minimal performance improvement could come from tracking animation state with an int based enum instead
     * of doing the string comparison
     */
    if (this.blockStateChange) return
    if (this.body.velocity.y > 0) {
      this.anims.play(this.animMap.downWalk, true)
    } else if (this.body.velocity.y < 0) {
      this.anims.play(this.animMap.upWalk, true)
    } else if (this.body.velocity.x > 0) {
      this.anims.play(this.animMap.rightWalk, true)
    } else if (this.body.velocity.x < 0) {
      this.anims.play(this.animMap.leftWalk, true)
    } else if (this.body.velocity.y === 0 && this.body.velocity.x === 0) {
      if (this.facing === Direction.DOWN) {
        this.anims.play(this.animMap.down, true)
      } else if (this.facing === Direction.UP) {
        this.anims.play(this.animMap.up, true)
      } else if (this.facing === Direction.RIGHT) {
        this.anims.play(this.animMap.right, true)
      } else if (this.facing === Direction.LEFT) {
        this.anims.play(this.animMap.left, true)
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


