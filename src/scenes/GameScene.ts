import { Player } from '../characters/Player'
import PathFinder from '../util/PathFinder'
import { Shopper } from '../characters/Shopper'
import { randomFrom } from 'goodish'
import { GameState } from '../types/GameState'
import {
  AnimKeys,
  AnimStates,
  CharKey,
  mapKey,
  SceneKey,
  SpriteSheet,
  tileSheetKey,
  TileTypes
} from '../types/PhaserKeys'
import { MainInputController } from '../controllers/MainInputController'
import { GameStateController } from '../controllers/GameStateController'
import { GameEvents } from '../types/GameEvents'
import { Point } from '../types/Geom'
import { Franken } from '../characters/Franken'
import GenerateFrameNumbers = Phaser.Types.Animations.GenerateFrameNumbers
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer
import Tile = Phaser.Tilemaps.Tile
import Game = Phaser.Game

declare const IS_DEV: boolean

export default class GameScene extends Phaser.Scene {

  public map!: Phaser.Tilemaps.Tilemap
  public pathFinder!: PathFinder
  public shoppers: Shopper[] = []
  public frankens: Franken[] = []
  private player!: Player
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []
  private mainInputController!: MainInputController

  public gameState!: GameState
  public staticObjects = {
    cashRegister: [] as Tile[],
    changingRooms: [] as Tile[],
    mannequinStands: [] as Tile[],
    frontShelves: [] as Tile[],
    stockShelves: [] as Tile[],
    operatingTable: [] as Tile[],
    frontDoor: [] as Tile[]
  }

  public tableLocation!: Point
  public tableFranken!: Phaser.GameObjects.Sprite

  constructor () {
    super({ key: SceneKey.GAME })
  }

  init (state?: GameState) {
    this.gameState = {
      time: 0,
      shoppers: [],
      frankens: [],
      money: 0,
      rearInventory: 0,
      frontInventory: 0,
      bodyParts: 0
    } as GameState
    this.scene.launch(SceneKey.HUD)
  }

  initDebug () {
    this.events.emit(GameEvents.GET_SHIPMENT, 100)
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 5000, () => {
        this.events.emit(GameEvents.BUILD_FRANKEN)
      }, [], null)
    }
  }

  preload () {
    this.load.spritesheet(SpriteSheet.PLAYER, require('../../assets/images/badass.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.spritesheet(SpriteSheet.SHOPPER, require('../../assets/images/shopper.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.spritesheet(SpriteSheet.FRANKEN, require('../../assets/images/franken.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.spritesheet(SpriteSheet.FRANKEN_ZAP, require('../../assets/images/franken-zap.png'), {
      frameWidth: 90,
      frameHeight: 67
    })
    this.load.image(tileSheetKey, require('../../assets/images/frankensheet.png'))
    this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/shop.json'))
    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/plugins/dist/rexuiplugin.min.js',
      sceneKey: 'rexUI'
    })
  }

  create () {
    this.createAnimations()
    this.initializeInput()
    this.makeMap()
    this.pathFinder = new PathFinder(this.map)
    this.initializeChars()
    this.initializeCollision()
    this.cameras.main.setDeadzone(16 * 8, 16 * 6)
    this.cameras.main.startFollow(this.player)
    this.cameras.main.roundPixels = true
    this.cameras.main.zoom = 1
    const controller = new GameStateController(this)
    this.initializeEvents()
    if (IS_DEV) {
      this.initDebug()
    }
  }

  makeMap () {
    this.map = this.make.tilemap({ key: mapKey, tileWidth: 16, tileHeight: 16 })
    const tiles = this.map.addTilesetImage('frankensheet', tileSheetKey)
    for (const layerData of this.map.layers) {
      // @ts-ignore
      const isStatic: boolean = layerData.properties.findIndex(p => p.name === 'static' && p.value) > -1
      const layer = isStatic ? this.map.createStaticLayer(layerData.name, tiles) : this.map.createDynamicLayer(layerData.name, tiles)
       this.layers.push(layer)
      for (const row of layerData.data) {
        // @ts-ignore
        for (let i = 0; i < row.length; i++) {
          // @ts-ignore
          const tile = row[i] as Tile
          if (tile.properties && tile.properties.type) {
            switch (tile.properties.type) {
              case TileTypes.VERTSHELF:
                this.staticObjects.frontShelves.push(tile)
                break
              case TileTypes.HORIZSHELF:
                this.staticObjects.frontShelves.push(tile)
                break
              case TileTypes.STORAGESHELF:
                this.staticObjects.stockShelves.push(tile)
                break
              case TileTypes.OPERATING_TABLE:
                if (!this.tableLocation) {
                  this.tableLocation = {
                    x: tile.pixelX,
                    y: (tile.y + 3) * this.map.tileHeight
                  }
                }
                break
              case TileTypes.CHANGING_ROOM:
                break
              case TileTypes.FRONTDOOR:
                this.staticObjects.frontDoor.push(tile)
                break
              case TileTypes.MANNEQUIN_STAND:
                break
              case TileTypes.REGISTER:
                break
            }
          }
        }
      }
    }
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  pause () {
    // TODO: Show the menu and stuff
    this.scene.pause()
  }

  resume () {
    // TODO: Hide the menu and stuff
    this.scene.resume()
  }

  initializeInput () {
    this.mainInputController = new MainInputController(this)
    this.input.on('keyup-ESC', () => {
      if (this.scene.isPaused()) {
        this.resume()
      } else {
        this.pause()
      }
    })
  }

  initializeEvents () {
    this.events.on(GameEvents.BUILD_FRANKEN, this.buildFranken, this)
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
      [AnimStates.RIGHT, { start: 10, end: 10 }]
    ]
    for (const [key, config] of mainCharAnims) {
      for (const [charKey, spriteKey] of [[CharKey.PLAYER, SpriteSheet.PLAYER], [CharKey.SHOPPER, SpriteSheet.SHOPPER], [CharKey.FRANKEN, SpriteSheet.FRANKEN]])
      this.anims.create({
        key: `${charKey}-${key}`,
        frames: this.anims.generateFrameNumbers(spriteKey, config),
        frameRate: 6,
        repeat: -1
      })
      this.anims.create({
        key: `${CharKey.SHOPPER}-${key}`,
        frames: this.anims.generateFrameNumbers(SpriteSheet.SHOPPER, config),
        frameRate: 6,
        repeat: -1
      })
      this.anims.create({

      })
    }
    this.anims.create({
      key: AnimKeys.FRANKEN_ZAP,
      frames: this.anims.generateFrameNumbers(SpriteSheet.FRANKEN_ZAP, {
        frames: [0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1]
      }),
      frameRate: 12
    })
  }

  initializeChars () {
    this.player = new Player(this, 100, 100, SpriteSheet.PLAYER)
    this.add.existing(this.player)
    this.mainInputController.enableCharacter(this.player)
    this.shoppers = []
    this.tableFranken = this.add.sprite(this.tableLocation.x + this.map.tileWidth * 1.5, this.tableLocation.y - this.map.tileHeight * 2, SpriteSheet.FRANKEN_ZAP).setVisible(false)
  }

  initializeCollision () {
    // this.physics.add.collider(this.player, this.layers)
  }

  update (time: number, delta: number) {
    this.pathFinder.update()
  }

  addShopper () {
    const frontDoorTile = randomFrom(this.staticObjects.frontDoor)
    const shopper = new Shopper(this, frontDoorTile.pixelX, frontDoorTile.pixelY, SpriteSheet.SHOPPER, CharKey.SHOPPER)
    console.log('create shopper', shopper)
    this.shoppers.push(shopper)
    this.add.existing(shopper)
    this.mainInputController.enableCharacter(shopper)
  }

  addFranken () {
    const franken = new Franken(this, this.tableLocation.x - this.map.tileWidth, this.tableLocation.y, SpriteSheet.FRANKEN, CharKey.FRANKEN)
    this.frankens.push(franken)
    this.add.existing(franken)
    this.mainInputController.enableCharacter(franken)
  }

  buildFranken () {
    this.tableFranken.setVisible(true)
    this.time.delayedCall((1000 / 13) * 16, () => {
      this.addFranken()
      this.tableFranken.setVisible(false)
    }, [], null)
    this.tableFranken.play(AnimKeys.FRANKEN_ZAP)
  }

}
