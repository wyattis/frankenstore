import { SceneKey } from '../types/PhaserKeys'
import GameScene from './GameScene'

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
    const inventoryText = this.add.text(10, 10, 'Inventory: 0')
    const bodyPartsText = this.add.text(10, 30, 'BodyParts: 0')
    const moneyText = this.add.text(10, 50, 'Money: 0')
    this.gameScene.events.on('money', (money: number) => {
      moneyText.setText(`Money: ${money}`)
    })
    this.gameScene.events.on('inventory', (inventory: number) => {
      inventoryText.setText(`'Inventory: ${inventory}`)
    })
    this.gameScene.events.on('bodyParts', (bodyParts: number) => {
      bodyPartsText.setText(`BodyParts: ${bodyParts}`)
    })
  }
}
