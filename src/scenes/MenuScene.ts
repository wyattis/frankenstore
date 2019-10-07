import { SceneKey } from '../types/PhaserKeys'

export default class MenuScene extends Phaser.Scene {

  constructor () {
    super({ key: SceneKey.MENU })
  }

  init () {
    console.log('menu started')
  }

}
