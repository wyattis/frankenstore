import * as EasyStar from 'easystarjs'
import { Cell, Point } from '../types/Geom'
import Tile = Phaser.Tilemaps.Tile

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
    for (let y = 0; y < map.height; y++) {
      const row = []
      for (let x = 0; x < map.width; x++) {
        let isCollision = false
        for (const layer of map.layers) {
          // @ts-ignore
          const tile: Tile = layer.data[y][x]
          if (tile.properties.hasOwnProperty('collides') && tile.properties.collides) {
            isCollision = true
            break
          }
        }
        if (isCollision) {
          row.push(1)
        } else {
          row.push(0)
        }
      }
      grid.push(row)
    }
    console.log('collision grid', grid)
    this.easyStar.setGrid(grid)
    this.easyStar.setAcceptableTiles([0])
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
