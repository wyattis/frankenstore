import { Player } from '../characters/Player'
import PathFinder from '../util/PathFinder'
import { Shopper } from '../characters/Shopper'
import { randomFrom, randomInt } from 'goodish'
import { GameState } from '../types/GameState'
import {
  AnimKeys,
  AnimStates,
  AudioKeys,
  CharKey,
  gameBoyThemeKey,
  mapKey,
  SceneKey,
  SpriteSheet,
  TileTypes
} from '../types/PhaserKeys'
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
import Size = Phaser.Structs.Size
import requireAll from '../requireAll'

const sheets = requireAll(require.context('../../assets/images/', true, /\.(png)$/))
console.log(sheets)
declare const IS_DEV: boolean

const spriteMap: [SpriteSheet, string, { frameWidth: number, frameHeight: number }][] = [
  [SpriteSheet.PLAYER, 'shopkeeper.png', { frameWidth: 32, frameHeight: 48 }],
  [SpriteSheet.SHOPPER_1, 'shopper1.png', { frameWidth: 32, frameHeight: 48 }],
  [SpriteSheet.SHOPPER_2, 'shopper2.png', { frameWidth: 32, frameHeight: 48 }],
  [SpriteSheet.SHOPPER_3, 'shopper3.png', { frameWidth: 32, frameHeight: 48 }],
  [SpriteSheet.FRANKEN, 'franken.png', { frameWidth: 32, frameHeight: 46 }],
  [SpriteSheet.FRANKEN_ZAP, 'franken-zap.png', { frameWidth: 90, frameHeight: 67 }],
  [SpriteSheet.MESS, 'mess.png', { frameWidth: 37, frameHeight: 28 }]
]

const normalSprites: typeof spriteMap = []
const gameBoySprites: typeof spriteMap = []
for (const m of spriteMap) {
  const colorId = './color/' + m[1]
  const gameboyId = './gameboy/' + m[1]
  normalSprites.push([m[0], sheets[colorId], m[2]])
  gameBoySprites.push([m[0], sheets[gameboyId], m[2]])
}

export default class GameScene extends Phaser.Scene {

  public map!: Phaser.Tilemaps.Tilemap
  public pathFinder!: PathFinder
  public nShoppers: number = 0
  public frankens: Franken[] = []
  private player!: Player
  private layers: (DynamicTilemapLayer | StaticTilemapLayer)[] = []
  private depthTiles: Phaser.GameObjects.Image[] = []
  public mainInputController!: MainInputController
  public isGameBoy: boolean = false

  public costs = {
    franken: {
      money: 100,
      bodyParts: 6,
      inventory: 1
    }
  }

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
    this.isGameBoy = window.location.href.includes(gameBoyThemeKey)
    this.gameState = {
      time: 0,
      shoppers: [],
      frankens: [],
      money: IS_DEV ? this.costs.franken.money : 0,
      rearInventory: IS_DEV ? 3 : 0,
      frontInventory: 0,
      bodyParts: IS_DEV ? this.costs.franken.bodyParts : 0,
      price: 50
    } as GameState
  }

  initDebug () {
    for (let i = 0; i < 2; i++) {
      this.time.delayedCall(i * 5000, () => {
        this.events.emit(GameEvents.BUILD_FRANKEN)
      }, [], null)
    }
  }


  create () {
    this.scene.launch(SceneKey.HUD)
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
      // this.initDebug()
    }
    // this.resize(this.scale.gameSize, this.scale.baseSize, this.scale.displaySize, this.scale.resolution)
    // this.scale.on('resize', this.resize, this)
  }

  resize (gameSize: Size, baseSize: Size, displaySize: Size, resolution: number) {
    this.cameras.resize(gameSize.width, gameSize.height)
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
    for (const c of (this.isGameBoy ? gameBoySprites : normalSprites)) {
      console.log(c)
      this.load.spritesheet(c[0], c[1], c[2])
    }
  }

  preload () {
    this.loadAudio()
    this.loadSprites()
    let path = './' + (this.isGameBoy ? 'gameboy' : 'color')
    if (IS_DEV) {
      this.load.spritesheet(SpriteSheet.TILESHEET, sheets[path + '/frankensheet.png'], {
        frameWidth: 16,
        frameHeight: 16
      })
      this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/shop.json'))
    } else {
      this.load.spritesheet(SpriteSheet.TILESHEET, sheets[path + '/frankensheet-extruded.png'], {
        frameWidth: 16,
        frameHeight: 16,
        spacing: 2,
        margin: 1
      })
      this.load.tilemapTiledJSON(mapKey, require('../../assets/maps/shop-extruded.json'))
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
    const shopperAnims: Generator[] = [
      [AnimStates.UP_WALK, { start: 0, end: 1 }],
      [AnimStates.DOWN_WALK, { start: 2, end: 3 }],
      [AnimStates.LEFT_WALK, { start: 0, end: 1 }],
      [AnimStates.RIGHT_WALK, { start: 2, end: 3 }],
      [AnimStates.UP, { frames: [0] }],
      [AnimStates.DOWN, { frames: [2] }],
      [AnimStates.LEFT, { frames: [0] }],
      [AnimStates.RIGHT, { frames: [2] }]
    ]
    const thangs: [CharKey, SpriteSheet, Generator[]][] = [
      [CharKey.PLAYER, SpriteSheet.PLAYER, mainCharAnims],
      [CharKey.FRANKEN, SpriteSheet.FRANKEN, frankenAnims],
      [CharKey.SHOPPER1, SpriteSheet.SHOPPER_1, shopperAnims],
      [CharKey.SHOPPER2, SpriteSheet.SHOPPER_2, shopperAnims],
      [CharKey.SHOPPER3, SpriteSheet.SHOPPER_3, shopperAnims]
    ]
    for (const [charKey, spriteKey, anims] of thangs) {
      for (const [key, config] of anims) {
        this.anims.create({
          key: `${charKey}-${key}`,
          frames: this.anims.generateFrameNumbers(spriteKey, config),
          frameRate: 6,
          repeat: -1
        })
      }
    }

    this.anims.create({
      key: `${CharKey.PLAYER}-stab-up`,
      frames: this.anims.generateFrameNumbers(SpriteSheet.PLAYER, {
        start: 16,
        end: 21
      }),
      frameRate: 6
    })

    this.anims.create({
      key: `${CharKey.PLAYER}-stab-down`,
      frames: this.anims.generateFrameNumbers(SpriteSheet.PLAYER, {
        start: 8,
        end: 13
      }),
      frameRate: 6
    })

    this.anims.create({
      key: AnimKeys.FRANKEN_ZAP,
      frames: this.anims.generateFrameNumbers(SpriteSheet.FRANKEN_ZAP, {
        frames: [0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1]
      }),
      frameRate: 12
    })
  }

  initializeChars () {
    this.player = new Player(this, 20 * this.map.tileWidth, 20 * this.map.tileHeight, SpriteSheet.PLAYER)
    this.add.existing(this.player)
    this.mainInputController.enableCharacter(this.player)
    this.tableFranken = this.add.sprite(this.tableLocation.x + this.map.tileWidth * 1.5, this.tableLocation.y - this.map.tileHeight * 2.1, SpriteSheet.FRANKEN_ZAP).setVisible(false)
    this.tableFranken.setDepth(10)
    this.mainInputController.select(this.player)
  }

  initializeCollision () {
    // this.physics.add.collider(this.player, this.layers)
  }

  update (time: number, delta: number) {
    this.pathFinder.update()
  }

  addShopper () {
    if (this.nShoppers >= 10) return
    const frontDoorTile = randomFrom(this.staticObjects.frontDoor)
    const randInt = randomInt(0, 3)
    console.log('add shopper', randInt)
    const keys = randomFrom([[SpriteSheet.SHOPPER_1, CharKey.SHOPPER1], [SpriteSheet.SHOPPER_2, CharKey.SHOPPER2], [SpriteSheet.SHOPPER_3, CharKey.SHOPPER3]] as [SpriteSheet, CharKey][])
    const shopper = new Shopper(this, frontDoorTile.pixelX, frontDoorTile.pixelY, keys[0], keys[1])
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
    const cost = this.costs.franken
    if (this.gameState.money < cost.money || this.gameState.bodyParts < cost.bodyParts || this.gameState.rearInventory + this.gameState.frontInventory < cost.inventory) {
      return this.events.emit(GameEvents.CANT_BUILD_FRANK)
    }

    this.gameState.bodyParts -= cost.bodyParts
    this.gameState.money -= cost.money
    if (this.gameState.rearInventory > 0) {
      this.gameState.rearInventory -= cost.inventory
    } else {
      this.gameState.frontInventory -= cost.inventory
    }

    this.tableFranken.setVisible(true)
    this.events.emit(GameEvents.FRANK_BUILT)
    this.time.delayedCall((1000 / 13) * 16, () => {
      this.addFranken()
      this.tableFranken.setVisible(false)
    }, [], null)
    this.tableFranken.play(AnimKeys.FRANKEN_ZAP)
  }

}
