import { MenuItem } from './MenuItem'

export default class Menu {
  constructor (private items: MenuItem[] = []) {}

  add (item: MenuItem) {
    this.items.push(item)
  }

}
