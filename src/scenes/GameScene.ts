import { Player } from '../characters/Player'
import PathFinder from '../util/PathFinder'
import { Shopper } from '../characters/Shopper'
import { randomFrom, randomInt } from 'goodish'
import { GameState } from '../types/GameState'
import { AnimStates, CharKey, mapKey, SceneKey, SpriteSheet, tileSheetKey, TileTypes } from '../types/PhaserKeys'
import { MainInputController } from '../controllers/MainInputController'
import { GameStateController } from '../controllers/GameStateController'
import GenerateFrameNumbers = Phaser.Types.Animations.GenerateFrameNumbers
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer
import Tile = Phaser.Tilemaps.Tile

export default class GameScene extends Phaser.Scene {

  public map!: Phaser.Tilemaps.Tilemap
  public pathFinder!: PathFinder
  private player!: Player
  private shoppers: Shopper[] = []
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []
  private gameState!: GameState
  private mainInputController!: MainInputController
  public staticObjects = {
    cashRegister: null,
    changingRooms: [] as Tile[],
    mannequinStands: [] as Tile[],
    frontShelves: [] as Tile[],
    stockShelves: [] as Tile[],
    operatingTable: null,
    frontDoor: [] as Tile[]
  }

  constructor () {
    super({ key: SceneKey.GAME })
  }

  init (state?: GameState) {
    this.scene.launch(SceneKey.HUD)
    this.gameState = state || {
      time: 0,
      shoppers: [],
      frankens: [],
      money: -1000,
      inventory: 0,
      bodyParts: 0
    } as GameState
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
      this.anims.create({
        key: `${CharKey.PLAYER}-${key}`,
        frames: this.anims.generateFrameNumbers(SpriteSheet.PLAYER, config),
        frameRate: 6,
        repeat: -1
      })
      this.anims.create({
        key: `${CharKey.SHOPPER}-${key}`,
        frames: this.anims.generateFrameNumbers(SpriteSheet.SHOPPER, config),
        frameRate: 6,
        repeat: -1
      })
    }
  }

  initializeChars () {
    this.player = new Player(this, 100, 100, SpriteSheet.PLAYER)
    this.add.existing(this.player)
    this.mainInputController.enableCharacter(this.player)
    this.shoppers = []
  }

  initializeCollision () {
    // this.physics.add.collider(this.player, this.layers)
  }

  update (time: number, delta: number) {
    this.pathFinder.update(time, delta)
  }

  addShopper () {
    const frontDoorTile = randomFrom(this.staticObjects.frontDoor)
    const shopper = new Shopper(this, frontDoorTile.pixelX, frontDoorTile.pixelY, SpriteSheet.SHOPPER, CharKey.SHOPPER)
    console.log('create shopper', shopper)
    this.shoppers.push(shopper)
    this.add.existing(shopper)
    this.mainInputController.enableCharacter(shopper)
  }

}
