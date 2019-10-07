import * as Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import HUDScene from './scenes/HUDScene'

declare const IS_DEV: boolean
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      // debug: IS_DEV
    }
  },
  scene: [
    GameScene,
    HUDScene
    // MenuScene
  ]
})
