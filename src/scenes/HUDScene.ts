import { AudioKeys, SceneKey, SpriteSheet } from '../types/PhaserKeys'
import GameScene from './GameScene'
import { GameEvents } from '../types/GameEvents'
import { Character } from '../characters/Character'
import { Shopper } from '../characters/Shopper'
import { randomFrom } from 'goodish'

declare const IS_DEV: boolean
console.log('is dev', IS_DEV)
export default class HUDScene extends Phaser.Scene {

  private gameScene!: GameScene

  private stockText!: Phaser.GameObjects.Text
  private bodyPartsText!: Phaser.GameObjects.Text
  private displayStockText!: Phaser.GameObjects.Text
  private workersText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private muteButton!: Phaser.GameObjects.Image
  private introButton!: Phaser.GameObjects.Image

  private selectedText!: Phaser.GameObjects.Text
  private theme!: Phaser.Sound.BaseSound
  private register!: Phaser.Sound.BaseSound
  private death!: Phaser.Sound.BaseSound
  private doors: Phaser.Sound.BaseSound[] = []

  private zaps: Phaser.Sound.BaseSound[] = []

  private boxColor = 0x84171D
  private hudColor = 0x3F3938
  private boxPadding = 20
  private textPadding = 10

  private introTextBox!: any
  private lossTextBox!: any

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

    this.moneyText = this.add.text(400, 10, 'Money: 0')
    this.selectedText = this.add.text(400, 30, `Selected: ${this.gameScene.mainInputController.selectedCharacter && this.gameScene.mainInputController.selectedCharacter.constructor.name}`)

    if (IS_DEV) {
      this.sound.mute = true
    }

    this.muteButton = this.add.image(600, 25, SpriteSheet.MUTE, this.sound.mute ? 0 : 1)
    this.muteButton.setInteractive().on('pointerup', () => {
      this.sound.mute = !this.sound.mute
      if (this.sound.mute) {
        this.muteButton.setFrame(0)
      } else {
        this.muteButton.setFrame(1)
      }
    })
    this.introButton = this.add.image(650, 25, SpriteSheet.INFO, 0)
    this.introButton.setInteractive().on('pointerup', () => {
      if (!this.introTextBox.visible) {
        this.showIntro()
      }
    })
  }

  updateMoney () {
    this.moneyText.setText(`Money: ${this.gameScene.gameState.money }`)
  }

  updateFrontInv () {
    this.displayStockText.setText(`Display: ${this.gameScene.gameState.frontInventory}`)
  }

  updateStock () {
    this.stockText.setText(`Stock: ${this.gameScene.gameState.rearInventory}`)
  }

  updateBodyParts () {
    this.bodyPartsText.setText(`BodyParts: ${this.gameScene.gameState.bodyParts}`)
  }

  create () {
    console.log('hud create')
    this.gameScene = this.scene.get(SceneKey.GAME) as GameScene
    this.makeAudio()
    this.makeHud()
    this.makeListeners()
    this.makeTextBoxes()
    this.showIntro()
  }

  makeTextBoxes () {
    const boxHeight = this.cameras.main.height / 4
    const boxWidth = this.cameras.main.width * 2 / 3
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2
    this.introTextBox = this.rexUI.add.textBox({
      x: centerX - boxWidth / 2,
      y: centerY - boxHeight / 2,
      background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, this.boxColor),
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
          width: boxWidth - this.boxPadding * 2
        }
      })
    }).setOrigin(0)
      .layout()
      .setInteractive()

    this.introTextBox.on('pointerup', () => {
      if (this.introTextBox.isTyping) {
        this.introTextBox.stop(true)
      } else {
        this.introTextBox.setVisible(false)
        this.introTextBox.setActive(false)
      }
    })

    this.lossTextBox = this.rexUI.add.textBox({
      x: centerX - boxWidth / 2,
      y: centerY - boxHeight / 2,
      background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, this.boxColor),
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
          width: boxWidth - this.boxPadding * 2
        }
      })
    }).setOrigin(0).layout().setInteractive().setVisible(false).setActive(false)

  }

  showLoss () {
    this.lossTextBox.setVisible(true).setActive(true)
    this.lossTextBox.on('pointerup', () => {
      if (this.lossTextBox.isTyping) {
        this.lossTextBox.stop(true)
      } else {
        this.scene.stop()
        this.gameScene.scene.restart()
      }
    })
    this.lossTextBox.start(`You weren't able to stay afloat! Be careful out there! You don't want to get caught!`, 30)
  }

  showIntro () {
    this.introTextBox.setVisible(true)
    this.introTextBox.setActive(true)
    this.introTextBox.start(`It's the grand opening of "Shirts for money"! You don't have any workers or inventory. How can you make ends meet? You have to pay for your inventory shipment soon, try to make some money by talking to customers. \n\nUse the mouse to select the shopkeeper and move him around. Click on objects around the map to interact with them.`, 30)
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

  makeListeners () {
    const gameState = this.gameScene.gameState
    this.gameScene.events.on(GameEvents.PURCHASE_INVENTORY, (cost: number) => {
      console.log('event', GameEvents.PURCHASE_INVENTORY)
      gameState.money -= cost
      this.updateMoney()
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
    this.gameScene.events.on(GameEvents.SELECT, (char: Character) => {
      console.log('event', GameEvents.SELECT)
      this.selectedText.setText(`Selected: ${char.constructor.name}`)
    })
    this.gameScene.events.on(GameEvents.DESELECT, () => {
      console.log('event', GameEvents.DESELECT)
      this.selectedText.setText('Selected: none')
    })
    this.gameScene.events.on(GameEvents.CASH_REGISTER, (o: { inventory: number, income: number }) => {
      console.log('event', GameEvents.CASH_REGISTER)
      gameState.frontInventory -= o.inventory
      gameState.money += o.income
      this.updateMoney()
      this.updateFrontInv()
      this.register.play()
    })
    this.gameScene.events.on(GameEvents.MURDER, (shopper: Shopper) => {
      console.log('event', GameEvents.MURDER)
      gameState.money += shopper.money
      this.updateMoney()
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
    })
    this.gameScene.events.on(GameEvents.CUSTOMER_ENTERS, () => {
      const sound = randomFrom(this.doors)
      sound.play()
    })
    this.gameScene.events.on(GameEvents.FRANK_BUILT, () => {
      const sound = randomFrom(this.zaps)
      sound.play()
      gameState.bodyParts -= 6
      gameState.money -= 10
      gameState.rearInventory -= 1
      this.updateBodyParts()
      this.updateMoney()
      this.updateStock()
      if (gameState.money < 0) {
        this.gameScene.events.emit(GameEvents.LOSS)
      }
    })
    this.gameScene.events.on(GameEvents.LOSS, () => {
      this.gameScene.pause()
      this.showLoss()
    })
  }



}
