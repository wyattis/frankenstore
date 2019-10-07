import GameObject = Phaser.GameObjects.GameObject

export interface Clickable extends GameObject {
  click (): void
}
