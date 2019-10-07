const fs = require('fs')
const map = require('./assets/maps/shop')

map.tilesets[0].margin = 1
map.tilesets[0].spacing = 2
map.tilesets[0].imagewidth = 630
map.tilesets[0].imageheight = 306
map.tilesets[0].image = '../images/frankensheet-extruded.png'

fs.writeFileSync('./assets/maps/shop-extruded.json', JSON.stringify(map, null, 2), 'utf8')
