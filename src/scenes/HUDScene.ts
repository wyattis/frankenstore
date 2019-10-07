import { SceneKey } from '../types/PhaserKeys'
import GameScene from './GameScene'
import { GameEvents } from '../types/GameEvents'
import { Character } from '../characters/Character'

export default class HUDScene extends Phaser.Scene {

  private gameScene!: GameScene

  constructor () {
    super({ key: SceneKey.HUD })
  }

  preload () {
    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/plugins/dist/rexuiplugin.min.js',
      sceneKey: 'rexUI'
    })
  }

  create () {
    console.log('hud create')
    this.gameScene = this.scene.get(SceneKey.GAME) as GameScene

    const stockText = this.add.text(10, 10, 'Stock: 0')
    const bodyPartsText = this.add.text(10, 30, 'BodyParts: 0')
    const moneyText = this.add.text(10, 50, 'Money: 0')

    const displayStockText = this.add.text(200, 10, 'Display: 0')
    const workersText = this.add.text(200, 50, 'Workers: 0')
    const selectedText = this.add.text(200, 30, 'Selected: none')

    const gameState = this.gameScene.gameState
    this.gameScene.events.on(GameEvents.PURCHASE_INVENTORY, (amount: number) => {
      gameState.money -= amount
      moneyText.setText(`Money: ${gameState.money }`)
    })
    this.gameScene.events.on(GameEvents.GET_SHIPMENT, (quantity: number) => {
      gameState.rearInventory += quantity
      stockText.setText(`Stock: ${gameState.rearInventory}`)
    })
    this.gameScene.events.on(GameEvents.ADD_DISPLAY, (quantity: number) => {
      gameState.frontInventory += quantity
      stockText.setText(`Display: ${gameState.frontInventory}`)
    })
    this.gameScene.events.on(GameEvents.BODY_PART, (bodyParts: number) => {
      bodyPartsText.setText(`BodyParts: ${bodyParts}`)
    })
    this.gameScene.events.on(GameEvents.SELECT, (char: Character) => {
      selectedText.setText(`Selected: ${char.constructor.name}`)
    })
    this.gameScene.events.on(GameEvents.DESELECT, () => {
      selectedText.setText('Selected: none')
    })
  }
}
