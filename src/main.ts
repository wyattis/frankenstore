import * as Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import HUDScene from './scenes/HUDScene'
import { randomInt } from 'goodish'

declare const IS_DEV: boolean
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: 0x3F3938,
  physics: {
    default: 'arcade',
    arcade: {
      // debug: true
    }
  },
  render: {
    pixelArt: true,
    roundPixels: true
  },
  scene: [
    GameScene,
    HUDScene
    // MenuScene
  ]
}

if (IS_DEV) {
  // @ts-ignore
  // config.scale = {
  //   mode: Phaser.Scale.RESIZE,
  //   parent: 'game',
  //   width: '100%',
  //   height: '100%'
  // }
}

new Phaser.Game(config)
