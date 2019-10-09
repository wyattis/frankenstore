import { AudioKeys, gameBoyThemeKey, SceneKey, SpriteSheet } from '../types/PhaserKeys'
import GameScene from './GameScene'
import { GameEvents } from '../types/GameEvents'
import { Character } from '../characters/Character'
import { Shopper } from '../characters/Shopper'
import { randomFrom } from 'goodish'

declare const IS_DEV: boolean
export default class HUDScene extends Phaser.Scene {

  private gameScene!: GameScene

  private stockText!: Phaser.GameObjects.Text
  private bodyPartsText!: Phaser.GameObjects.Text
  private displayStockText!: Phaser.GameObjects.Text
  private workersText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private muteButton!: Phaser.GameObjects.Image
  private introButton!: Phaser.GameObjects.Image
  private themeButton!: Phaser.GameObjects.Image

  private baseStockText!: Phaser.GameObjects.Text
  private theme!: Phaser.Sound.BaseSound
  private register!: Phaser.Sound.BaseSound
  private death!: Phaser.Sound.BaseSound
  private doors: Phaser.Sound.BaseSound[] = []

  private zaps: Phaser.Sound.BaseSound[] = []

  private boxColor = 0x84171D
  private hudColor = 0x3F3938
  private boxPadding = 20
  private textPadding = 10
  private stockPrice = 2
  private baseStockPurchase = 50
  private numStockPurchases = 1
  private nextStockPurchase = 50
  private numShirtPurchases = 0
  private numFrankens = 0

  private introTextBox!: any
  private lossTextBox!: any
  private winTextBox!: any
  private warningPopups: { [key in GameEvents]?: any } = {}

  public rexUI!: any

  constructor () {
    super({ key: SceneKey.HUD })
  }

  preload () {
    this.load.audio(AudioKeys.THEME, require('../../assets/audio/frankenstein - edgar winter group.mp3'))
    this.load.image(SpriteSheet.INFO, require('../../assets/images/info.png'))
    this.load.spritesheet(SpriteSheet.MUTE, require('../../assets/images/mute.png'), {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet(SpriteSheet.THEME, require('../../assets/images/theme.png'), {
      frameWidth: 64,
      frameHeight: 32
    })
    this.load.scenePlugin({
      key: 'rexuiplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/plugins/dist/rexuiplugin.min.js',
      sceneKey: 'rexUI'
    })
  }

  makeHud () {
    const graphics = this.add.graphics()
    graphics.fillStyle(this.hudColor)
    graphics.fillRect(0, 0, this.cameras.main.width, 50)

    this.stockText = this.add.text(10, 10, 'Stock: 0')
    this.bodyPartsText = this.add.text(10, 30, 'BodyParts: 0')

    this.displayStockText = this.add.text(200, 10, 'Display: 0')
    this.workersText = this.add.text(200, 30, 'Workers: 0')

    this.moneyText = this.add.text(350, 10, 'Money: $0')
    this.baseStockText = this.add.text(350, 30, `Inventory shipment: $${this.stockPrice * this.nextStockPurchase}`)

    this.muteButton = this.add.image(620, 25, SpriteSheet.MUTE, 0)
    this.introButton = this.add.image(660, 25, SpriteSheet.INFO, 0)
    this.themeButton = this.add.image(720, 25, SpriteSheet.THEME, this.gameScene.isGameBoy ? 1 : 0)

    this.updateStock()

    this.updateBodyParts()
    this.updateMoney()
    if (IS_DEV) {
      this.sound.mute = true
    }
    this.time.delayedCall(2 * 1000, () => {
      if (this.sound.mute) {
        this.muteButton.setFrame(0)
      }
    }, [], null)
    this.muteButton.setInteractive().on('pointerup', () => {
      this.sound.mute = !this.sound.mute
      if (this.sound.mute) {
        this.muteButton.setFrame(0)
      } else {
        this.muteButton.setFrame(1)
      }
    })
    this.introButton.setInteractive().on('pointerup', () => {
      if (!this.introTextBox.visible) {
        this.showIntro()
      }
    })
    this.themeButton.setInteractive().on('pointerup', () => {
      let nextLoc = window.location.href
      if (this.gameScene.isGameBoy) {
        nextLoc = nextLoc.replace(gameBoyThemeKey, '')
      } else {
        nextLoc += gameBoyThemeKey
      }
      window.location.href = nextLoc
    })
  }

  win () {
    const winText = `Congrats! You're officially a sociopath! Enjoy the rest of the game jam!`
    this.winTextBox.setVisible(true).setActive(true).start(winText, 30)
  }

  updateMoney () {
    this.moneyText.setText(`Money: $${this.gameScene.gameState.money }`)
    if (this.gameScene.gameState.money > 2000) {
      this.win()
    }
  }

  updateWorkers () {
    this.workersText.setText(`Workers: ${this.numFrankens}`)
  }

  updateNextStock () {
    this.baseStockText.setText(`Inventory shipment: $${this.stockPrice * this.nextStockPurchase}`)
  }

  updateFrontInv () {
    this.displayStockText.setText(`Display: ${this.gameScene.gameState.frontInventory}`)
  }

  updateStock () {
    this.stockText.setText(`Stock: ${this.gameScene.gameState.rearInventory}`)
  }

  updateBodyParts () {
    this.bodyPartsText.setText(`Body parts: ${this.gameScene.gameState.bodyParts}`)
  }

  create () {
    console.log('hud create')
    this.gameScene = this.scene.get(SceneKey.GAME) as GameScene
    this.makeAudio()
    this.makeHud()
    this.makeListeners()
    this.makeTextBoxes()
    this.showIntro()
    this.makeWarnings()
  }

  makeWarnings () {
    const costs = this.gameScene.costs.franken
    const warnings: [GameEvents, string][] = [
      [GameEvents.CANT_BUILD_FRANK, `It costs ${costs.money} money, ${costs.bodyParts} body parts, and ${costs.inventory} inventory to build a franken-worker. Make some sales or find another way to build one!`]
    ]
    for (const [key, text] of warnings) {
      const box = this.makeBox(this.cameras.main.width * 2 / 3, this.cameras.main.height / 6, text)
        .setOrigin(0).layout()
        .setVisible(false).setInteractive()
        .setActive(false)
      box.on('pointerup', () => {
        if (box.isTyping) {
          box.stop(true)
        } else {
          this.gameScene.resume()
          box.setVisible(false).setActive(false)
        }
      })
      this.warningPopups[key] = box
      this.gameScene.events.on(key, () => {
        this.gameScene.pause()
        box.setVisible(true).setActive(true).start(text, 30)
      })
    }
  }

  makeBox (boxWidth: number, boxHeight: number, text: string = '', color: number = this.boxColor): any {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2
    return this.rexUI.add.textBox({
      x: centerX - boxWidth / 2,
      y: centerY - boxHeight / 2,
      background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, color),
      space: {
        left: this.boxPadding,
        right: this.boxPadding,
        top: this.boxPadding,
        text: this.textPadding
      },
      text: this.rexUI.add.BBCodeText(0, 0, '', {
        fixedWidth: boxWidth,
        fixedHeight: boxHeight,
        wrap: {
          mode: 'word',
          width: boxWidth
        }
      })
    })
  }

  makeTextBoxes () {
    const boxHeight = this.cameras.main.height / 4
    const boxWidth = this.cameras.main.width * 2 / 3

    this.introTextBox = this.makeBox(boxWidth, boxHeight).setOrigin(0).layout().setInteractive()

    this.introTextBox.on('pointerup', () => {
      if (this.introTextBox.isTyping) {
        this.introTextBox.stop(true)
      } else {
        this.introTextBox.setVisible(false).setActive(false)
        this.gameScene.resume()
      }
    })

    this.lossTextBox = this.makeBox(this.cameras.main.width / 2, boxHeight).setOrigin(0).layout().setInteractive().setVisible(false).setActive(false)
    this.winTextBox = this.makeBox(this.cameras.main.width / 4, this.cameras.main.width / 2).setOrigin(0).layout().setInteractive().setVisible(false).setActive(false)
    this.winTextBox.on('pointerup', () => {
      if (this.winTextBox.isTyping) {
        this.winTextBox.stop(true)
      } else {
        this.restart()
      }
    })
  }

  restart () {
    window.location.reload()
    // this.sound.stopAll()
    // this.scene.stop()
    // this.gameScene.scene.restart()
  }

  showLoss () {
    this.lossTextBox.setVisible(true).setActive(true)
    this.lossTextBox.on('pointerup', () => {
      if (this.lossTextBox.isTyping) {
        this.lossTextBox.stop(true)
      } else {
        this.restart()
      }
    })
    this.lossTextBox.start(`You lose! You weren't able to pay for your inventory shipment this month!`, 30)
  }

  showIntro () {
    this.gameScene.pause()
    this.introTextBox.setVisible(true)
    this.introTextBox.setActive(true)
    const startText = `It's the grand opening of "Shirts for money"! You don't have any workers or inventory. ` +
      `How can you make ends meet? You have to pay for your inventory shipment soon, try to make some money by talking to customers. ` +
      `\n\nUse the mouse to select the shopkeeper and move him around. Click on objects such as the operating table to interact with them.`
    this.introTextBox.start(startText, 30)
  }

  makeAudio () {
    this.sound.volume = .2
    this.theme = this.sound.add(AudioKeys.THEME, {
      loop: true
    })
    this.theme.play()
    this.register = this.sound.add(AudioKeys.REGISTER)
    this.death = this.sound.add(AudioKeys.SHOPPER_DEATH)
    this.doors = [AudioKeys.DOOR_1, AudioKeys.DOOR_2].map(key => this.sound.add(key))
    this.zaps = [AudioKeys.FRANK_ZAP_1, AudioKeys.FRANK_ZAP_2,AudioKeys.FRANK_ZAP_3].map(key => this.sound.add(key))
  }

  checkLose () {
    if (this.gameScene.gameState.money < 0) {
      this.gameScene.events.emit(GameEvents.LOSS)
    }
  }

  makeListeners () {
    const gameState = this.gameScene.gameState
    this.gameScene.events.on(GameEvents.PURCHASE_INVENTORY, () => {
      console.log('event', GameEvents.PURCHASE_INVENTORY)
      gameState.money -= this.stockPrice * this.nextStockPurchase
      gameState.rearInventory += this.nextStockPurchase
      this.numStockPurchases++
      this.nextStockPurchase = this.numStockPurchases * this.baseStockPurchase
      this.updateMoney()
      this.checkLose()
      this.updateNextStock()
    })
    this.gameScene.events.on(GameEvents.GET_SHIPMENT, (quantity: number) => {
      console.log('event', GameEvents.GET_SHIPMENT)
      gameState.rearInventory += quantity
      this.updateStock()
    })
    this.gameScene.events.on(GameEvents.ADD_DISPLAY, (quantity: number) => {
      console.log('event', GameEvents.ADD_DISPLAY)
      gameState.frontInventory += quantity
      this.updateFrontInv()
    })
    this.gameScene.events.on(GameEvents.REDUCE_STOCK, (quantity: number) => {
      console.log('event', GameEvents.REDUCE_STOCK)
      gameState.rearInventory -= quantity
      this.updateStock()
    })
    this.gameScene.events.on(GameEvents.CASH_REGISTER, (o: { inventory: number, income: number }) => {
      console.log('event', GameEvents.CASH_REGISTER)
      gameState.frontInventory -= o.inventory
      gameState.money += o.income
      this.numShirtPurchases++
      this.updateMoney()
      this.updateFrontInv()
      this.register.play()
    })
    this.gameScene.events.on(GameEvents.MURDER, (shopper: Shopper) => {
      console.log('event', GameEvents.MURDER)
      gameState.money += shopper.money
      gameState.rearInventory += shopper.clothes
      gameState.frontInventory += shopper.inventory
      this.gameScene.nShoppers--
      this.updateMoney()
      this.updateStock()
      this.updateFrontInv()
      this.death.play()
    })
    this.gameScene.events.on(GameEvents.RETRIEVE_PARTS, (parts: number) => {
      console.log('event', GameEvents.RETRIEVE_PARTS)
      gameState.bodyParts += parts
      this.updateBodyParts()
    })
    this.gameScene.events.on(GameEvents.CUSTOMER_LEAVE, () => {
      const sound = randomFrom(this.doors)
      sound.play()
      this.gameScene.nShoppers--
    })
    this.gameScene.events.on(GameEvents.CUSTOMER_ENTERS, () => {
      const sound = randomFrom(this.doors)
      this.gameScene.nShoppers++
      sound.play()
    })
    this.gameScene.events.on(GameEvents.FRANK_BUILT, () => {
      this.numFrankens++
      const sound = randomFrom(this.zaps)
      sound.play()
      this.updateBodyParts()
      this.updateMoney()
      this.updateStock()
      this.checkLose()
      this.updateWorkers()
    })
    this.gameScene.events.on(GameEvents.LOSS, () => {
      this.gameScene.pause()
      this.showLoss()
    })
  }



}
