import { AudioKeys, SceneKey } from '../types/PhaserKeys'
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
  private selectedText!: Phaser.GameObjects.Text

  private theme!: Phaser.Sound.BaseSound
  private register!: Phaser.Sound.BaseSound
  private death!: Phaser.Sound.BaseSound
  private doors: Phaser.Sound.BaseSound[] = []
  private zaps: Phaser.Sound.BaseSound[] = []

  constructor () {
    super({ key: SceneKey.HUD })
  }

  preload () {
    this.load.audio(AudioKeys.THEME, require('../../assets/audio/frankenstein - edgar winter group.mp3'))}

  makeHud () {
    const graphics = this.add.graphics()
    graphics.fillStyle(0xFF0000)
    graphics.fillRect(0, 0, this.cameras.main.width, 50)

    this.stockText = this.add.text(10, 10, 'Stock: 0')
    this.bodyPartsText = this.add.text(10, 30, 'BodyParts: 0')

    this.displayStockText = this.add.text(200, 10, 'Display: 0')
    this.workersText = this.add.text(200, 30, 'Workers: 0')

    this.moneyText = this.add.text(400, 10, 'Money: 0')
    this.selectedText = this.add.text(400, 30, 'Selected: none')
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
  }

  makeAudio () {
    this.sound.volume = .2
    this.theme = this.sound.add(AudioKeys.THEME, {
      loop: true
    })
    if (!IS_DEV) {
      this.theme.play()
    }
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
    })
  }



}
