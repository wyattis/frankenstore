export enum SpriteSheet {
  PLAYER = 'player',
  SHOPPER = 'shopper'
}
export enum AnimStates {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
  LEFT_WALK = 'left-walk',
  RIGHT_WALK = 'right-walk',
  UP_WALK = 'up-walk',
  DOWN_WALK = 'down-walk'
}

export enum CharKey {
  PLAYER = 'player',
  SHOPPER = 'shopper',
  FRANKEN = 'franken'
}

export enum SceneKey {
  MENU = 'menu',
  GAME = 'game',
  HUD = 'hud'
}

export enum TileTypes {
  VERTSHELF = 'vertshelf',
  HORIZSHELF = 'horizshelf',
  STORAGESHELF = 'storageshelf',
  OPERATING_TABLE = 'operating',
  CHANGING_ROOM = 'changing room',
  FRONTDOOR = 'frontdoor',
  MANNEQUIN_STAND = 'mannequin stand',
  REGISTER = 'register'
}

export const mapKey = 'shop'
export const tileSheetKey = 'tiles'
