import GameScene from '../scenes/GameScene'
import { CharKey, TileTypes } from '../types/PhaserKeys'
import { Action } from '../types/Action'
import { ActionableCharacter } from './ActionableCharacter'
import { AICharacter } from './AICharacter'
import { randomFrom, randomInt } from 'goodish'

export class Shopper extends AICharacter {

  public isSelectable = false
  public money: number
  public clothes: number = 1
  public bodyParts: number = 5
  public inventory: number = 0

  constructor (public scene: GameScene, x: number, y: number, texture: string, charKey: CharKey) {
    super(scene, x, y, texture, charKey)
    this.money = randomInt(5, 1000)
  }

  makeDecision () {
    if (this.inventory === 0) {
      const clothingRack = randomFrom(this.scene.staticObjects.frontShelves)
      // this.moveToTile({ x: randomInt(0, this.scene.map.width - 1), y: randomInt(0, this.scene.map.height - 1) })
      if (clothingRack.properties.type === TileTypes.VERTSHELF) {
        this.moveToTile({
          x: clothingRack.x - 3,
          y: clothingRack.y
        })
      } else {
        this.moveToTile({
          x: clothingRack.x,
          y: clothingRack.y + 3
        })
      }
    }
  }

  showMenuFor (char: ActionableCharacter) {
    const options = [{
      label: 'Kill',
      action: () => char.act(Action.KILL, this)
    }]
  }

}
