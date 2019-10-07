export interface GameState {
  time: number
  shoppers: ShopperState[]
  frankens: FrankenState[]
  money: number
  rearInventory: number
  frontInventory: number
  bodyParts: number
  price: number
}

export interface ShopperState {
  cash: number
  x: number
  y: number
}

export interface FrankenState {
  intelligence: number
  x: number
  y: number
  assignment: FrankenAssignment
}

export enum FrankenAssignment {
  MANNEQUIN,
  RESTOCK,
  JANITOR,
  REGISTER,
  SECURITY,
  MANAGER,
  IDLE
}
