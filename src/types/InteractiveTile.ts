import Tile = Phaser.Tilemaps.Tile

export interface InteractiveTile extends Tile {
  charX: number
  charY: number
}
