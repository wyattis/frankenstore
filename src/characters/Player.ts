import { CharKey, TileTypes } from '../types/PhaserKeys'
import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { ActionableCharacter } from './ActionableCharacter'
import { Action, CharacterEvent } from '../types/Action'
import Tile = Phaser.Tilemaps.Tile
import { GameEvents } from '../types/GameEvents'
import { distanceSquaredBetweenPoints } from '../util/M'
import { Shopper } from './Shopper'
import GameObject = Phaser.GameObjects.GameObject
import Mess from '../objects/Mess'
import { InteractiveTile } from '../types/InteractiveTile'
import ANIMATION_COMPLETE = Phaser.Animations.Events.ANIMATION_COMPLETE

export enum Direction {
  UP,
  DOWN,
  RIGHT,
  LEFT
}

export class Player extends ActionableCharacter {

  actions = {
    [Action.KILL]: this.killChar.bind(this),
    [Action.HELP]: this.helpChar.bind(this),
    [Action.BUILD]: this.buildFranken.bind(this)
  }

  private actionRadius2: number

  constructor (public scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, CharKey.PLAYER)
    this.actionRadius2 = Math.pow(2 * Math.max(this.scene.map.tileWidth, this.scene.map.tileHeight), 2)
  }

  buildFranken () {
    const d = distanceSquaredBetweenPoints(this.scene.tableLocation, this)
    console.log(d, this.actionRadius2)
    if (d > this.actionRadius2) {
      this.moveTo(this.scene.tableLocation)
    } else {
      console.log('build franken')
      this.scene.events.emit(GameEvents.BUILD_FRANKEN)
    }
  }

  killChar (char: Shopper) {
    const UP_KEY = `${this.charKey}-stab-up`
    const DOWN_KEY = `${this.charKey}-stab-down`
    char.isLocked = true
    let key: string
    if (char.y > this.y) {
      key = UP_KEY
      this.moveTo({
        x: char.x,
        y: char.y + 1
      })
    } else {
      key = DOWN_KEY
      this.moveTo({
        x: char.x,
        y: char.y - 1
      })
    }

    this.once(CharacterEvent.PATH_COMPLETE, () => {
      this.blockStateChange = true
      this.on(`animationcomplete-${key}`, () => {
        char.isLocked = false
        char.kill()
      })
      this.isLocked = true
      this.anims.play(key, true)
    })

  }

  helpChar (char: MovableCharacter) {

  }

  actOn (obj: Phaser.GameObjects.Container) {
    console.log('act on', obj)
    const closeEnoughToAct = distanceSquaredBetweenPoints(this, obj) < this.actionRadius2
    if (obj instanceof Shopper) {
      if (closeEnoughToAct) {
        this.killChar(obj)
      } else {
        this.moveTo(obj)
      }
    } else if (obj instanceof Mess) {
      if (closeEnoughToAct) {
        obj.interact()
      } else {
        this.moveTo(obj)
      }
    } else {
      this.moveTo(obj)
    }
  }

  actOnTile (tile: InteractiveTile) {
    console.log('act on tile', tile)
    switch (tile.properties.type) {
      case TileTypes.OPERATING_TABLE:
        this.buildFranken()
        break
      default:
        this.moveToTile(tile)
    }
  }

  // preUpdate (time: number, delta: number) {
  //   if (this.keys.W.isDown) {
  //     this.moveUp()
  //   } else if (this.keys.S.isDown) {
  //     this.moveDown()
  //   } else {
  //     this.body.setVelocityY(0)
  //   }
  //   if (this.keys.D.isDown) {
  //     this.moveRight()
  //   } else if (this.keys.A.isDown) {
  //     this.moveLeft()
  //   } else {
  //     this.body.setVelocityX(0)
  //   }
  //   super.preUpdate(time, delta)
  // }

}
