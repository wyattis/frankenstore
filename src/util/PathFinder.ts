import * as EasyStar from 'easystarjs'

export interface Point { x: number, y: number }
export interface Cell { row: number, col: number }
export default class PathFinder {
  private easyStar!: EasyStar.js
  public tileWidth: number
  public tileHeight: number

  constructor (map: Phaser.Tilemaps.Tilemap) {
    this.tileWidth = map.tileWidth
    this.tileHeight = map.tileHeight
    this.initEasyStar(map)
  }

  private initEasyStar (map: Phaser.Tilemaps.Tilemap) {
    this.easyStar = new EasyStar.js()
    const grid: number[][] = []
    const acceptableTiles: number[] = []
    for (let y = 0; y < map.height; y++) {
      const row = []
      for (let x = 0; x < map.width; x++) {
        const tiles: Phaser.Tilemaps.Tile[] = map.getTilesWithin(x, y)
        if (tiles.length) {
          const tileIndex = tiles[0].index
          row.push(tileIndex)
          let isCollidable = false
          for (const tile of tiles) {
            if (Array.isArray(tile.properties)) {
              isCollidable = tile.properties.findIndex((p: { name: string, value: any }) => p.name === 'collides' && p.value) > -1
            } else {
              isCollidable = tile.properties.collides
            }
            if (isCollidable) {
              break
            }
          }
          if (!isCollidable) {
            acceptableTiles.push(tileIndex)
          }
        } else {
          row.push(-1)
        }
      }
      grid.push(row)
    }
    this.easyStar.setGrid(grid)
    this.easyStar.setAcceptableTiles(acceptableTiles)
  }

  public pointToCell (point: Point): Cell {
    return {
      row: Math.floor(point.y / this.tileHeight),
      col: Math.floor(point.x / this.tileWidth)
    }
  }

  public cellPointToPoint (cellPoint: Point, offset?: Point): Point {
    if (!offset) {
      offset = {
        x: this.tileWidth / 2,
        y: this.tileHeight / 2
      }
    }
    return {
      x: cellPoint.x * this.tileWidth + offset.x,
      y: cellPoint.y * this.tileHeight + offset.y
    }
  }

  public findPathPixels (start: Point, end: Point): Promise<Point[]> {
    return this.findPath(this.pointToCell(start), this.pointToCell(end))
  }

  public findPath (start: Cell, end: Cell): Promise<Point[]> {
    return new Promise((resolve, reject) => {
      this.easyStar.findPath(start.col, start.row, end.col, end.row, (path => {
        if (path !== null) {
          resolve(path)
        } else {
          reject(new Error('Path was not found between these points'))
        }
      }))
    })
  }

  update (time: number, delta: number) {
    this.easyStar.calculate()
  }

}
