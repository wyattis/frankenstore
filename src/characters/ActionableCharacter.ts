import { Action } from '../types/Action'
import { MovableCharacter } from './MovableCharacter'
import Tile = Phaser.Tilemaps.Tile
import GameObject = Phaser.GameObjects.GameObject

export abstract class ActionableCharacter extends MovableCharacter {

  public isSelectable: boolean = true
  abstract actions: { [key in Action]?: (...u: any[]) => void }

  abstract actOn (obj: GameObject): void
  abstract actOnTile (tile: Tile): void

  act (key: Action, ...args: any[]) {
    if (this.actions.hasOwnProperty(key)) {
      // @ts-ignore
      this.actions[key](...args)
    } else {
      console.error('action does not exist on entity', key)
    }
  }

}
