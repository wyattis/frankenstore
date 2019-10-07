import GameScene from '../scenes/GameScene'
import { CharKey } from '../types/PhaserKeys'
import { MenuItem } from '../ui/MenuItem'
import { MovableCharacter } from './MovableCharacter'

export class Franken extends MovableCharacter {

  private menuActions: MenuItem[] = []

  constructor (scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
  }



}
