import { AnimKeys, AnimStates, CharKey, TileTypes } from '../types/PhaserKeys'
import { MovableCharacter } from './MovableCharacter'
import GameScene from '../scenes/GameScene'
import { ActionableCharacter } from './ActionableCharacter'
import { Action, CharacterEvent } from '../types/Action'
import { GameEvents } from '../types/GameEvents'
import { distanceSquaredBetweenPoints } from '../util/M'
import { Shopper } from './Shopper'
import Mess from '../objects/Mess'
import { InteractiveTile } from '../types/InteractiveTile'
import { Point } from '../types/Geom'

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
  private actionState: string = 'idle'

  constructor (public scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, CharKey.PLAYER)
    this.actionRadius2 = Math.pow(2 * Math.max(this.scene.map.tileWidth, this.scene.map.tileHeight), 2)
    this.setSize(25, 37).setOrigin(.5, .8)
  }

  buildFranken () {
    const d = distanceSquaredBetweenPoints(this.scene.tableLocation, this)
    this.log(d, this.actionRadius2)
    if (d > this.actionRadius2) {
      this.moveTo(this.scene.tableLocation)
    } else {
      this.log('build franken')
      this.scene.events.emit(GameEvents.BUILD_FRANKEN)
    }
  }

  async killChar (char: Shopper) {
    this.log('Player kill char', char)
    if (this.actionState === 'kill char') return
    this.actionState = 'kill char'
    const UP_KEY = `${this.charKey}-stab-up`
    const DOWN_KEY = `${this.charKey}-stab-down`
    char.lock()
    let movePoint: Point = {
      x: char.x,
      y: char.y
    }
    try {
      await this.moveTo(movePoint)
      this.once(CharacterEvent.PATH_COMPLETE, () => {
        this.log('Player path complete')
        this.stab(`${this.charKey}-${AnimStates.DOWN}`, DOWN_KEY, char)
      })
    } catch (err) {
      this.log('Skipping player movement')
      this.stab(`${this.charKey}-${AnimStates.DOWN}`, DOWN_KEY, char)
    }

  }

  stab (dirAnimKey: string, stabKey: string, char: Shopper) {
    this.log('turning player', dirAnimKey)
    this.blockStateChange = true
    this.once('animationcomplete', () => {
      this.scene.time.delayedCall(1, () => {
        this.once(`animationcomplete-${stabKey}`, () => {
          this.blockStateChange = false
          char.kill()
          this.actionState = 'idle'
        })
        this.play(stabKey)
      }, [], null)
    })
    this.play(dirAnimKey, false)
  }

  helpChar (char: MovableCharacter) {

  }

  actOn (obj: Phaser.GameObjects.Container) {
    this.log('act on', obj)
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
    this.log('act on tile', tile)
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
