// Les styles sont livrés tels quels, avec la police d'icônes à côté : c'est le bundler de l'app qui
// résout les @import et l'url() de la police (et la sert comme un fichier, pas intégrée au CSS).
import { cpSync } from 'node:fs'

// Les gardes des feuilles (*.test.ts) vivent à côté d'elles ; elles n'ont rien à faire dans le
// paquet publié, qui ne livre que du CSS.
cpSync('src/styles', 'dist/styles', { recursive: true, filter: (src) => !src.endsWith('.test.ts') })
cpSync('src/assets', 'dist/assets', { recursive: true })
