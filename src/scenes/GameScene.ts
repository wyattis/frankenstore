import { Player } from '../characters/Player'
import PathFinder from '../util/PathFinder'
import { Shopper } from '../characters/Shopper'
import { randomFrom } from 'goodish'
import { GameState } from '../types/GameState'
import { AnimKeys, AnimStates, AudioKeys, CharKey, mapKey, SceneKey, SpriteSheet, TileTypes } from '../types/PhaserKeys'
import { MainInputController } from '../controllers/MainInputController'
import { GameStateController } from '../controllers/GameStateController'
import { GameEvents } from '../types/GameEvents'
import { Point } from '../types/Geom'
import { Franken } from '../characters/Franken'
import { InteractiveTile } from '../types/InteractiveTile'
import GenerateFrameNumbers = Phaser.Types.Animations.GenerateFrameNumbers
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer
import Tile = Phaser.Tilemaps.Tile

declare const IS_DEV: boolean

export default class GameScene extends Phaser.Scene {

  public map!: Phaser.Tilemaps.Tilemap
  public pathFinder!: PathFinder
  public shoppers: Shopper[] = []
  public frankens: Franken[] = []
  private player!: Player
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []
  private depthTiles: Phaser.GameObjects.Image[] = []
  public mainInputController!: MainInputController

  public gameState!: GameState
  public staticObjects = {
    cashRegister: [] as InteractiveTile[],
    changingRooms: [] as InteractiveTile[],
    mannequinStands: [] as InteractiveTile[],
    frontShelves: [] as InteractiveTile[],
    stockShelves: [] as InteractiveTile[],
    operatingTable: [] as InteractiveTile[],
    frontDoor: [] as InteractiveTile[]
  }

  private hudSize = 50
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
      bodyParts: 0,
      price: 10
    } as GameState
    this.scene.launch(SceneKey.HUD)
  }

  initDebug () {
    for (let i = 0; i < 2; i++) {
      this.time.delayedCall(i * 5000, () => {
        this.events.emit(GameEvents.BUILD_FRANKEN)
      }, [], null)
    }
  }

  loadAudio () {
    this.load.audio(AudioKeys.FRANK_VOICE_1, require('../../assets/audio/effects/snd-frank-voice-1.wav'))
    this.load.audio(AudioKeys.FRANK_VOICE_2, require('../../assets/audio/effects/snd-frank-voice-2.wav'))
    this.load.audio(AudioKeys.FRANK_VOICE_3, require('../../assets/audio/effects/snd-frank-voice-3.wav'))
    this.load.audio(AudioKeys.REGISTER, require('../../assets/audio/effects/snd-payment-1.wav'))
    this.load.audio(AudioKeys.SHOPPER_DEATH, require('../../assets/audio/effects/snd-shopper-death-1.wav'))
    this.load.audio(AudioKeys.DOOR_1, require('../../assets/audio/effects/snd-door-1.wav'))
    this.load.audio(AudioKeys.DOOR_2, require('../../assets/audio/effects/snd-door-2.wav'))
    this.load.audio(AudioKeys.FRANK_ZAP_1, require('../../assets/audio/effects/snd-zap-1.wav'))
    this.load.audio(AudioKeys.FRANK_ZAP_2, require('../../assets/audio/effects/snd-zap-2.wav'))
    this.load.audio(AudioKeys.FRANK_ZAP_3, require('../../assets/audio/effects/snd-zap-3.wav'))
  }

  loadSprites () {
    this.load.spritesheet(SpriteSheet.PLAYER, require('../../assets/images/shopkeeper.png'), {
      frameWidth: 32,
      frameHeight: 46
    })
    this.load.spritesheet(SpriteSheet.SHOPPER, require('../../assets/images/shopper.png'), {
      frameWidth: 19,
      frameHeight: 29
    })
    this.load.spritesheet(SpriteSheet.FRANKEN, require('../../assets/images/franken.png'), {
      frameWidth: 32,
      frameHeight: 46
    })
    this.load.spritesheet(SpriteSheet.FRANKEN_ZAP, require('../../assets/images/franken-zap.png'), {
      frameWidth: 90,
      frameHeight: 67
    })
    this.load.spritesheet(SpriteSheet.MESS, require('../../assets/images/mess.png'), {
      frameWidth: 37,
      frameHeight: 28
    })
  }

  preload () {
    this.loadAudio()
    this.loadSprites()
    if (IS_DEV) {
      this.load.spritesheet(SpriteSheet.TILESHEET, require('../../assets/images/frankensheet.png'), {
        frameWidth: 16,
        frameHeight: 16
      })
    } else {
      this.load.spritesheet(SpriteSheet.TILESHEET, require('../../assets/images/frankensheet-extruded.png'), {
        frameWidth: 16,
        frameHeight: 16,
        spacing: 2,
        margin: 1
      })
    }
    this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/shop.json'))
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
    this.cameras.main.zoom = 1.5
    const controller = new GameStateController(this)
    this.initializeEvents()
    if (IS_DEV) {
      this.initDebug()
    }
  }

  makeMap () {
    this.map = this.make.tilemap({ key: mapKey, tileWidth: 16, tileHeight: 16 })
    const tiles = this.map.addTilesetImage('frankensheet', SpriteSheet.TILESHEET)

    function tileToInteractiveTile (tile: Tile): InteractiveTile {
      const interactiveTile = tile as InteractiveTile
      const xOffset = tile.properties && tile.properties.xOffset ? tile.properties.xOffset : 0
      const yOffset = tile.properties && tile.properties.yOffset ? tile.properties.yOffset : 0
      interactiveTile.charX = tile.x + xOffset
      interactiveTile.charY = tile.y + yOffset
      return interactiveTile
    }

    let hasDrawnCharacters = false
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
                this.staticObjects.frontShelves.push(tileToInteractiveTile(tile))
                break
              case TileTypes.HORIZSHELF:
                this.staticObjects.frontShelves.push(tileToInteractiveTile(tile))
                break
              case TileTypes.STORAGESHELF:
                this.staticObjects.stockShelves.push(tileToInteractiveTile(tile))
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
                this.staticObjects.frontDoor.push(tileToInteractiveTile(tile))
                break
              case TileTypes.MANNEQUIN_STAND:
                break
              case TileTypes.REGISTER:
                this.staticObjects.cashRegister.push(tileToInteractiveTile(tile))
                break
            }
          }
          if (tile.properties && tile.properties.height) {
            const tileImage = this.add.image(tile.pixelX + this.map.tileWidth, tile.pixelY + this.map.tileHeight, SpriteSheet.TILESHEET, tile.index - 1)
            tileImage.setDepth(tile.y + tile.properties.height)
            tileImage.setOrigin(1, 1)
            if (tile.properties.type === TileTypes.VERTSHELF) {
              console.log('tile depth', tileImage.depth, tile)
            }
            this.depthTiles.push(tileImage)
          }
        }
      }
    }
    this.cameras.main.setBounds(0, -this.hudSize, this.map.widthInPixels, this.map.heightInPixels + this.hudSize)
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
    type Generator = [AnimStates, GenerateFrameNumbers]
    const mainCharAnims: Generator[] = [
      [AnimStates.UP_WALK, { start: 4, end: 7 }],
      [AnimStates.DOWN_WALK, { start: 0, end: 3 }],
      [AnimStates.LEFT_WALK, { start: 0, end: 3 }],
      [AnimStates.RIGHT_WALK, { start: 4, end: 7 }],
      [AnimStates.UP, { start: 4, end: 4 }],
      [AnimStates.DOWN, { start: 1, end: 1 }],
      [AnimStates.LEFT, { start: 1, end: 1 }],
      [AnimStates.RIGHT, { start: 4, end: 4 }]
    ]
    const frankenAnims: Generator[] = [
      [AnimStates.UP_WALK, { start: 4, end: 7 }],
      [AnimStates.DOWN_WALK, { start: 0, end: 3 }],
      [AnimStates.LEFT_WALK, { start: 0, end: 3 }],
      [AnimStates.RIGHT_WALK, { start: 4, end: 7 }],
      [AnimStates.UP, { frames: [4, 6] }],
      [AnimStates.DOWN, { frames: [0, 2] }],
      [AnimStates.LEFT, { frames: [0, 2] }],
      [AnimStates.RIGHT, { frames: [4, 6] }]
    ]
    const thangs: [CharKey, SpriteSheet, Generator[]][] = [[CharKey.PLAYER, SpriteSheet.PLAYER, mainCharAnims], [CharKey.FRANKEN, SpriteSheet.FRANKEN, frankenAnims]]
    for (const [charKey, spriteKey, anims] of thangs) {
      for (const [key, config] of anims) {
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
      }
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
    this.events.emit(GameEvents.CUSTOMER_ENTERS, shopper)
  }

  addFranken () {
    const franken = new Franken(this, this.tableLocation.x - this.map.tileWidth, this.tableLocation.y, SpriteSheet.FRANKEN, CharKey.FRANKEN)
    this.frankens.push(franken)
    this.add.existing(franken)
    this.mainInputController.enableCharacter(franken)
  }

  buildFranken () {
    this.tableFranken.setVisible(true)
    this.events.emit(GameEvents.FRANK_BUILT)
    this.time.delayedCall((1000 / 13) * 16, () => {
      this.addFranken()
      this.tableFranken.setVisible(false)
    }, [], null)
    this.tableFranken.play(AnimKeys.FRANKEN_ZAP)
  }

}
