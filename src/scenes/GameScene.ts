import { Player } from '../characters/Player'
import GenerateFrameNumbers = Phaser.Types.Animations.GenerateFrameNumbers
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer
import PathFinder from '../util/PathFinder'
import { Shopper } from '../characters/Shopper'
import { randomInt } from 'goodish'

enum SpriteSheet {
  PLAYER = 'player',
  SHOPPER = 'shopper'
}
export enum AnimStates {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
  LEFT_WALK = 'left-walk',
  RIGHT_WALK = 'right-walk',
  UP_WALK = 'up-walk',
  DOWN_WALK = 'down-walk'
}

export enum CharKey {
  PLAYER = 'player',
  SHOPPER = 'shopper',
  FRANKEN = 'franken'
}

const mapKey = 'map'
const tileSheetKey = 'tiles'

export default class GameScene extends Phaser.Scene {

  public name = 'game'
  private player!: Player
  private shoppers: Shopper[] = []
  private map!: Phaser.Tilemaps.Tilemap
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []
  private pathFinder!: PathFinder


  preload () {
    this.load.spritesheet(SpriteSheet.PLAYER, require('../../assets/images/badass.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.spritesheet(SpriteSheet.SHOPPER, require('../../assets/images/badass.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.image(tileSheetKey, require('../../assets/images/test-tiles.png'))
    this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/test2.json'))
  }

  create () {
    this.createAnimations()
    this.makeMap()
    this.pathFinder = new PathFinder(this.map)
    this.initializeChars()
    this.initializeCollision()
    this.cameras.main.setDeadzone(16 * 8, 16 * 6)
    this.cameras.main.startFollow(this.player)
  }

  makeMap () {
    this.map = this.make.tilemap({ key: mapKey, tileWidth: 16, tileHeight: 16 })
    const tiles = this.map.addTilesetImage('test', tileSheetKey)
    for (const layerData of this.map.layers) {
      // @ts-ignore
      const isStatic: boolean = layerData.properties.findIndex(p => p.name === 'static' && p.value) > -1
      const layer = isStatic ? this.map.createStaticLayer(layerData.name, tiles) : this.map.createDynamicLayer(layerData.name, tiles)
      this.map.setCollisionByProperty({ collides: true })
      this.layers.push(layer)
    }

    // layer.setCollisionByProperty({ collides: true })
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

  }

  createAnimations () {
    const mainCharAnims: [AnimStates, GenerateFrameNumbers][] = [
      [AnimStates.UP_WALK, { start: 0, end: 2 }],
      [AnimStates.DOWN_WALK, { start: 3, end: 5 }],
      [AnimStates.LEFT_WALK, { start: 6, end: 8 }],
      [AnimStates.RIGHT_WALK, { start: 9, end: 11 }],
      [AnimStates.UP, { start: 1, end: 1 }],
      [AnimStates.DOWN, { start: 4, end: 4 }],
      [AnimStates.LEFT, { start: 7, end: 7 }],
      [AnimStates.RIGHT, { start: 10, end: 10 }],
    ]
    for (const [key, config] of mainCharAnims) {
      this.anims.create({
        key: `${CharKey.PLAYER}-${key}`,
        frames: this.anims.generateFrameNumbers(SpriteSheet.PLAYER, config),
        frameRate: 6,
        repeat: -1
      })
      this.anims.create({
        key: `${CharKey.SHOPPER}-${key}`,
        frames: this.anims.generateFrameNumbers(SpriteSheet.PLAYER, config),
        frameRate: 6,
        repeat: -1
      })
    }
  }

  initializeChars () {
    this.player = new Player(this, 100, 100, SpriteSheet.PLAYER)
    this.add.existing(this.player)

    for (let i = 0; i < 1; i++) {
      const shopper = new Shopper(this, randomInt(0, 200), randomInt(0, 200), SpriteSheet.SHOPPER, CharKey.SHOPPER, this.pathFinder)
      this.add.existing(shopper)
      this.shoppers.push(shopper)
    }

  }

  initializeCollision () {
    this.physics.add.collider(this.player, this.layers)
  }

  update (time: number, delta: number) {
    this.pathFinder.update(time, delta)
  }

}
