export interface GameState {
  time: number
  shoppers: ShopperState[]
  frankens: FrankenState[]
  money: number
  inventory: number
  bodyParts: number
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
  JANITOR
}

export enum SmartFrankeAssignment {
  REGISTER,
  SECURITY
}

export enum FinalFrankenAssignment {
  MANAGER
}
