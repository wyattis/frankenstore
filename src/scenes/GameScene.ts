import { Player } from '../characters/Player'
import GameObject = Phaser.GameObjects.GameObject
import GenerateFrameNumbers = Phaser.Types.Animations.GenerateFrameNumbers
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer

enum SpriteSheet {
  MAIN = 'main'
}
export enum MainAnim {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
  LEFT_WALK = 'left-walk',
  RIGHT_WALK = 'right-walk',
  UP_WALK = 'up-walk',
  DOWN_WALK = 'down-walk'
}

const mapKey = 'map'
const tileSheetKey = 'tiles'

export default class GameScene extends Phaser.Scene {

  public name = 'game'
  private player!: Player
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []


  preload () {
    this.load.spritesheet(SpriteSheet.MAIN, require('../../assets/images/badass.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.image(tileSheetKey, require('../../assets/images/test-tiles.png'))
    this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/test2.json'))
  }

  create () {
    this.createAnimations()
    this.makeMap()
    this.initializeChars()
    this.initializeCollision()
    this.cameras.main.setDeadzone(16 * 8, 16 * 6)
    this.cameras.main.startFollow(this.player)
  }

  makeMap () {
    const map = this.make.tilemap({ key: mapKey, tileWidth: 16, tileHeight: 16 })
    const tiles = map.addTilesetImage('test', tileSheetKey)
    for (const layerData of map.layers) {
      // @ts-ignore
      const isStatic: boolean = layerData.properties.findIndex(p => p.name === 'static' && p.value) > -1
      const layer = isStatic ? map.createStaticLayer(layerData.name, tiles) : map.createDynamicLayer(layerData.name, tiles)
      map.setCollisionByProperty({ collides: true })
      this.layers.push(layer)
    }

    // layer.setCollisionByProperty({ collides: true })
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

  }

  createAnimations () {
    const mainCharAnims: [MainAnim, GenerateFrameNumbers][] = [
      [MainAnim.UP_WALK, { start: 0, end: 2 }],
      [MainAnim.DOWN_WALK, { start: 3, end: 5 }],
      [MainAnim.LEFT_WALK, { start: 6, end: 8 }],
      [MainAnim.RIGHT_WALK, { start: 9, end: 11 }],
      [MainAnim.UP, { start: 1, end: 1 }],
      [MainAnim.DOWN, { start: 4, end: 4 }],
      [MainAnim.LEFT, { start: 7, end: 7 }],
      [MainAnim.RIGHT, { start: 10, end: 10 }],
    ]
    for (const [key, config] of mainCharAnims) {
      this.anims.create({
        key: key,
        frames: this.anims.generateFrameNumbers(SpriteSheet.MAIN, config),
        frameRate: 6,
        repeat: -1
      })
    }
  }

  initializeChars () {
    this.player = new Player(this, 100, 100, SpriteSheet.MAIN)
    this.add.existing(this.player)
  }

  initializeCollision () {
    this.physics.add.collider(this.player, this.layers)
  }

}
