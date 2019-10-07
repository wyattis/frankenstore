import * as EasyStar from 'easystarjs'
import { Cell, Point } from '../types/Geom'
import Tile = Phaser.Tilemaps.Tile
import { randomInt } from 'goodish'
import { Direction } from '../characters/Player'

export default class PathFinder {
  private easyStar!: EasyStar.js
  private grid: number[][] = []
  public tileWidth: number
  public tileHeight: number

  constructor (map: Phaser.Tilemaps.Tilemap) {
    this.tileWidth = map.tileWidth
    this.tileHeight = map.tileHeight
    this.initEasyStar(map)
  }

  private initEasyStar (map: Phaser.Tilemaps.Tilemap) {
    this.easyStar = new EasyStar.js()
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
      this.grid.push(row)
    }
    console.log('collision this.grid', this.grid)
    this.easyStar.setGrid(this.grid)
    this.easyStar.setAcceptableTiles([0])
  }

  public pointToCell (point: Point): Cell {
    return {
      row: this.pixelsToTile(point.y, this.tileHeight),
      col: this.pixelsToTile(point.x, this.tileWidth)
    }
  }

  public pointToCellPoint (point: Point): Point {
    return {
      y: this.pixelsToTile(point.y, this.tileHeight),
      x: this.pixelsToTile(point.x, this.tileWidth)
    }
  }

  public pixelsToTile (pixels: number, tileSize: number): number {
    return Math.floor(Math.abs(pixels) / tileSize)
  }

  public cellPointToPoint (cellPoint: Point, offset?: Point): Point {
    return {
      x: cellPoint.x * this.tileWidth,
      y: cellPoint.y * this.tileHeight
    }
  }

  public cellPointToCell (cellPoint: Point): Cell {
    return {
      row: cellPoint.y,
      col: cellPoint.x
    }
  }

  public cellToPoint (cell: Cell): Point {
    return {
      x: cell.col * this.tileWidth,
      y: cell.row * this.tileHeight
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
          reject(new Error(`Path was not found between these points. ${start.col}, ${start.row} and ${end.col} ${end.row}`))
        }
      }))
    })
  }

  public tileIsBlocked (cell: Cell): boolean {
    try {
      return this.grid[cell.row][cell.col] === 1
    } catch (err) {
      return true
    }
  }

  public pointIsBlocked (point: Point): boolean {
    try {
      return this.grid[point.y][point.x] === 1
    } catch (err){
      return true
    }
  }

  public findNearestClearPoint (point: Point, r = 2): Point {
    let c = 0
    point = { x: point.x, y: point.y }
    let pointBlocked = true
    while (pointBlocked && c < 100) {
      point.x += randomInt(-r, r + 1)
      point.y += randomInt(-r, r + 1)
      c++
      pointBlocked = this.pointIsBlocked(point)
    }
    console.log('found cell in', c, point)
    return point
  }

  update () {
    this.easyStar.calculate()
  }

}
