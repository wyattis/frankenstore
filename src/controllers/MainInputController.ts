import GameScene from '../scenes/GameScene'
import Pointer = Phaser.Input.Pointer
import { ActionableCharacter } from '../characters/ActionableCharacter'
import { MovableCharacter } from '../characters/MovableCharacter'
import { GameEvents } from '../types/GameEvents'
import { Clickable } from '../types/Clickable'
import GameObject = Phaser.GameObjects.GameObject
import { Player } from '../characters/Player'
import { Action } from '../types/Action'

export class MainInputController {

  private canClickMap: boolean = true
  public selectedCharacter!: ActionableCharacter | null

  constructor (private scene: GameScene) {
    scene.input.mouse.capture = true
    scene.input.mouse.disableContextMenu()
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.canClickMap) {
        this.canClickMap = true
        return
      }
      console.log('main map click', pointer)
      if (pointer.button === 0) {
        // Left click
        this.clickMap(pointer)
      } else {
        // Right click
        this.deselect()
      }
    })
  }

  public select (char: ActionableCharacter) {
    this.selectedCharacter = char
    this.scene.events.emit(GameEvents.SELECT, char)
  }

  public deselect () {
    console.log('main deselect')
    // this.selectedCharacter = null
    // this.scene.events.emit(GameEvents.DESELECT)
  }

  public enableCharacter (char: MovableCharacter) {
    char.setInteractive()
    char.on('pointerdown', (pointer: Pointer) => {
      if (pointer.button !== 0) return
      this.canClickMap = false
      this.clickCharacter(char)
    }, null)
  }

  public enableObject (obj: GameObject) {
    obj.setInteractive()
    obj.on('pointerdown', (pointer: Pointer) => {
      if (pointer.button !== 0) return
      this.canClickMap = false
      if (this.selectedCharacter) {
         this.selectedCharacter.actOn(obj)
      }
    })
  }

  public clickCharacter (char: MovableCharacter | ActionableCharacter) {
    console.log('main clicked char', arguments)
    if (char !== this.selectedCharacter) {
      if (this.selectedCharacter) {
        this.selectedCharacter.actOn(char)
      } else if (char instanceof ActionableCharacter && char.isSelectable) {
        this.select(char)
      }
    }
  }

  public clickMap (pointer: Pointer) {
    console.log('main map click', this)
    if (this.selectedCharacter) {
      const tiles = this.scene.map.getTilesWithinWorldXY(pointer.worldX, pointer.worldY, 1, 1)
      console.log('tiles', tiles)
      for (const tile of tiles) {
        if (tile.properties && tile.properties.type) {
          return this.selectedCharacter.actOnTile(tile)
        }
      }
      console.log('main move player to', pointer)
      this.selectedCharacter.moveTo({
        x: pointer.worldX,
        y: pointer.worldY
      })
    }
  }

}
