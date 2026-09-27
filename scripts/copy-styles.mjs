// Les styles sont livrés tels quels, avec la police d'icônes à côté : c'est le bundler de l'app qui
// résout les @import et l'url() de la police (et la sert comme un fichier, pas intégrée au CSS).
import { cpSync } from 'node:fs'

cpSync('src/styles', 'dist/styles', { recursive: true })
cpSync('src/assets', 'dist/assets', { recursive: true })
