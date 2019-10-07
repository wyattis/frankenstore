import GameScene from '../scenes/GameScene'
import Pointer = Phaser.Input.Pointer
import { ActionableCharacter } from '../characters/ActionableCharacter'
import { MovableCharacter } from '../characters/MovableCharacter'
import { GameEvents } from '../types/GameEvents'

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
      if (pointer.button === 0) {
        // Left click
        this.clickMap(pointer)
      } else {
        // Right click
        this.deselect()
      }
    })
  }

  public deselect () {
    console.log('deselect')
    this.selectedCharacter = null
    this.scene.events.emit(GameEvents.DESELECT)
  }

  public enableCharacter (char: MovableCharacter) {
    char.setInteractive()
    char.on('pointerdown', (pointer: Pointer) => {
      this.canClickMap = false
      this.clickCharacter(char)
    }, null)
  }

  public clickCharacter (char: MovableCharacter | ActionableCharacter) {
    console.log('clicked char', arguments)
    if (char !== this.selectedCharacter) {
      if (this.selectedCharacter) {
        this.selectedCharacter.actOn(char)
      } else if (char instanceof ActionableCharacter && char.isSelectable) {
        this.selectedCharacter = char
        this.scene.events.emit(GameEvents.SELECT, char)
      }
    }
  }

  public clickMap (pointer: Pointer) {
    console.log('map click', this)
    if (this.selectedCharacter) {
      console.log('move player to', pointer)
      this.selectedCharacter.moveTo({
        x: pointer.worldX,
        y: pointer.worldY
      })
    }
  }

}
