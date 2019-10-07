import { CharKey, TileTypes } from '../types/PhaserKeys'
import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { ActionableCharacter } from './ActionableCharacter'
import { Action } from '../types/Action'
import Tile = Phaser.Tilemaps.Tile
import { GameEvents } from '../types/GameEvents'
import { distanceSquaredBetweenPoints } from '../util/M'

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
    this.actionRadius2 = Math.pow(3 * Math.max(this.scene.map.tileWidth, this.scene.map.tileHeight), 2)
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

  killChar (char: MovableCharacter) {

  }

  helpChar (char: MovableCharacter) {

  }

  actOn (char: MovableCharacter) {
    console.log('act on', char)
  }

  actOnTile (tile: Tile) {
    console.log('act on tile', tile)
    switch (tile.properties.type) {
      case TileTypes.OPERATING_TABLE:
        this.buildFranken()
        break
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
